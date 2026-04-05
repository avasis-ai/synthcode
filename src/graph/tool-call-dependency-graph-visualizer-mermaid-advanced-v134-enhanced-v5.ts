import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface AdvancedGraphOptions {
  defaultGraphType?: "graph TD" | "graph LR";
  styleMap?: Record<string, {
    class?: string;
    style?: string;
  }>;
  customDirectives?: string[];
}

export class ToolCallDependencyGraphVisualizer {
  private readonly options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions = {}) {
    this.options = {
      defaultGraphType: "graph TD",
      styleMap: {},
      customDirectives: [],
      ...options,
    };
  }

  private getNodeLabel(message: Message): string {
    if ("user" === message.role) {
      return `User Input: ${message.content.substring(0, 30)}...`;
    }
    if ("assistant" === message.role) {
      return `Assistant Response`;
    }
    if ("tool" === message.role) {
      return `Tool Result (${message.tool_use_id})`;
    }
    return "Unknown Message";
  }

  private getToolUseNodeId(block: ToolUseBlock): string {
    return `Tool_${block.id}`;
  }

  private renderBlockToMermaid(block: ContentBlock, nodeId: string): string {
    if (block.type === "text") {
      return `${nodeId}["${block.text.substring(0, 50)}..."]`;
    }
    if (block.type === "tool_use") {
      const toolUseBlock = block as ToolUseBlock;
      const nodeLabel = `${toolUseBlock.name} (Input: ${JSON.stringify(toolUseBlock.input)})`;
      return `${nodeId}["${nodeLabel}"]`;
    }
    if (block.type === "thinking") {
      const thinkingBlock = block as ThinkingBlock;
      return `${nodeId}["Thinking: ${thinkingBlock.thinking.substring(0, 50)}..."]`;
    }
    return "";
  }

  private generateGraphDefinition(messages: Message[]): {
    mermaidCode: string;
    nodes: Record<string, string>;
    edges: string[];
  } {
    let mermaidCode = `graph ${this.options.defaultGraphType || "graph TD"}\n`;
    const nodes: Record<string, string> = {};
    const edges: string[] = [];
    let nodeIdCounter = 1;

    const processMessage = (message: Message, index: number): {
      nodeId: string;
      mermaidCode: string;
    } => {
      let currentId = `M${index}`;
      let nodeMermaid = "";

      if ("user" === message.role) {
        nodeMermaid = `${currentId}["${this.getNodeLabel(message)}"]`;
        nodes[currentId] = nodeMermaid;
        return { nodeId: currentId, mermaidCode: nodeMermaid };
      }

      if ("assistant" === message.role) {
        let lastBlockId: string | null = null;
        let blockMermaid = "";
        let blockEdges: string[] = [];

        for (let i = 0; i < message.content.length; i++) {
          const block = message.content[i];
          let blockId: string;
          let blockNodeMermaid: string;

          if (block.type === "text") {
            blockId = `T${i}_${currentId}`;
            blockNodeMermaid = `${blockId}["${block.text.substring(0, 50)}..."]`;
            nodes[blockId] = blockNodeMermaid;
            blockEdges.push(`${lastBlockId} --> ${blockId}`);
            lastBlockId = blockId;
          } else if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            blockId = this.getToolUseNodeId(toolUseBlock);
            blockNodeMermaid = `${blockId}["${toolUseBlock.name} (Input: ${JSON.stringify(toolUseBlock.input)})"]`;
            nodes[blockId] = blockNodeMermaid;
            blockEdges.push(`${lastBlockId} --> ${blockId}`);
            lastBlockId = blockId;
          } else if (block.type === "thinking") {
            const thinkingBlock = block as ThinkingBlock;
            blockId = `TH${i}_${currentId}`;
            blockNodeMermaid = `${blockId}["Thinking: ${thinkingBlock.thinking.substring(0, 50)}..."]`;
            nodes[blockId] = blockNodeMermaid;
            blockEdges.push(`${lastBlockId} --> ${blockId}`);
            lastBlockId = blockId;
          }
        }
        
        const finalNodeId = `A${index}`;
        nodes[finalNodeId] = `subgraph ${finalNodeId} [${this.getNodeLabel(message)}]\n${blockMermaid.join('\n')}`;
        
        const finalEdges = [...blockEdges, `${currentId} --> ${finalNodeId}`];
        return { nodeId: finalNodeId, mermaidCode: finalEdges.join('\n') };
      }

      if ("tool" === message.role) {
        const toolResultMessage = message as ToolResultMessage;
        const nodeId = `TR_${toolResultMessage.tool_use_id}`;
        const nodeMermaid = `${nodeId}["Tool Result: ${toolResultMessage.content.substring(0, 50)}...${toolResultMessage.is_error ? " (ERROR)" : ""}"]`;
        nodes[nodeId] = nodeMermaid;
        return { nodeId: nodeId, mermaidCode: `${currentId} --> ${nodeId}` };
      }

      return { nodeId: "N/A", mermaidCode: "" };
    };

    let allEdges: string[] = [];
    let allNodes: Record<string, string> = {};

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const { nodeId, mermaidCode } = processMessage(message, i);
      allEdges.push(mermaidCode);
    }

    let finalMermaid = "";
    if (this.options.customDirectives && this.options.customDirectives.length > 0) {
      finalMermaid += this.options.customDirectives.join('\n') + "\n";
    }

    finalMermaid += Object.values(nodes).join('\n') + "\n";
    finalMermaid += allEdges.join('\n');

    return {
      mermaidCode: finalMermaid,
      nodes: Object.values(nodes),
      edges: allEdges,
    };
  }

  public render(messages: Message[]): string {
    const { mermaidCode } = this.generateGraphDefinition(messages);
    return mermaidCode;
  }
}