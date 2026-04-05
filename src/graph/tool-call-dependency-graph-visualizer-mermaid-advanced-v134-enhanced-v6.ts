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

export interface FlowControlNode {
  id: string;
  type: "if" | "loop";
  condition: string;
  onTrue: string;
  onFalse?: string;
  onExit?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV6 {
  private messages: Message[];
  private flowNodes: FlowControlNode[];

  constructor(messages: Message[], flowNodes: FlowControlNode[] = []) {
    this.messages = messages;
    this.flowNodes = flowNodes;
  }

  private buildToolCallNodes(message: AssistantMessage): string[] {
    const toolUseBlocks = (message.content as ContentBlock[]).filter(
      (block) => block.type === "tool_use"
    );
    if (toolUseBlocks.length === 0) {
      return [];
    }

    const toolCallNodes: string[] = [];
    toolUseBlocks.forEach((block, index) => {
      const nodeId = `T${index}_${block.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      toolCallNodes.push(`  ${nodeId}["Tool Call: ${block.name}"]`);
    });
    return toolCallNodes;
  }

  private buildMessageNodes(messages: Message[]): string[] {
    const nodes: string[] = [];
    let counter = 1;

    for (const message of messages) {
      const nodeId = `M${counter++}`;
      let label = "";

      if (message.role === "user") {
        label = `User Input: "${message.content.substring(0, 30)}..."`;
        nodes.push(`  ${nodeId}["User Message"]`);
      } else if (message.role === "assistant") {
        const toolNodes = this.buildToolCallNodes(message as AssistantMessage);
        const thinkingText = (message as AssistantMessage).content.some(
          (block) => block.type === "thinking"
        ) ? "Thinking/Response" : "Assistant Response";
        nodes.push(`  ${nodeId}["Assistant: ${thinkingText}"]`);
      } else if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        const errorStatus = toolResultMessage.is_error ? "ERROR" : "SUCCESS";
        label = `Tool Result (${toolResultMessage.tool_use_id}): ${errorStatus}`;
        nodes.push(`  ${nodeId}["Tool Result: ${toolResultMessage.tool_use_id}"]`);
      }
    }
    return nodes;
  }

  private buildFlowControlSyntax(): string {
    if (this.flowNodes.length === 0) {
      return "";
    }

    let syntax = "";
    this.flowNodes.forEach((node, index) => {
      const nodeId = node.id;
      syntax += `\n  ${nodeId}["${node.type.toUpperCase()} (${node.condition})"]`;

      if (node.type === "if") {
        syntax += `\n  ${nodeId} -->|True| ${node.onTrue};`;
        if (node.onFalse) {
          syntax += `\n  ${nodeId} -->|False| ${node.onFalse};`;
        }
        if (node.onExit) {
          syntax += `\n  ${nodeId} -->|Exit| ${node.onExit};`;
        }
      } else if (node.type === "loop") {
        syntax += `\n  ${nodeId} -->|Loop| ${node.onExit || nodeId};`;
      }
    });
    return syntax;
  }

  public visualize(): string {
    let mermaid = "graph TD;\n";

    // 1. Build Nodes (Messages/Tools)
    const messageNodes = this.buildMessageNodes(this.messages);
    mermaid += messageNodes.join("\n") + "\n";

    // 2. Build Flow Control Nodes
    const flowSyntax = this.buildFlowControlSyntax();
    mermaid += flowSyntax;

    // 3. Build Edges (Dependencies)
    let edges = "";
    let lastNodeId: string | null = null;

    // Simple sequential linking for demonstration, needs refinement for real graph traversal
    // For this advanced version, we assume the flow nodes dictate the primary structure.
    
    // Link initial message to the first flow control node or first tool call
    if (this.messages.length > 0) {
        const initialMessageId = `M1`;
        if (this.flowNodes.length > 0) {
            edges += `\n${initialMessageId} -->|Start| ${this.flowNodes[0].id};`;
        } else {
            // Fallback: simple sequential link
            edges += `\n${initialMessageId} -->|Next Step| M2;`;
        }
    }

    // Link flow control nodes to subsequent steps (Highly simplified for structure)
    if (this.flowNodes.length > 0) {
        const lastFlowNodeId = this.flowNodes[this.flowNodes.length - 1].id;
        // Assume the last flow node connects to the final tool result or end state
        edges += `\n${lastFlowNodeId} -->|End| E1["End of Flow"];`;
    } else if (this.messages.length > 1) {
        // If no explicit flow control, just link sequentially
        edges += "\n";
        for (let i = 1; i < this.messages.length; i++) {
            const currentId = `M${i + 1}`;
            const prevId = `M${i}`;
            edges += `${prevId} -->|Sequential| ${currentId};`;
        }
    }

    mermaid += edges;

    return mermaid;
  }
}