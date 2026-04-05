import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface AdvancedGraphOptions {
  graphType?: "flowchart" | "graph" | "dataflow";
  customStyles?: Record<string, string>;
  defaultNodeStyle?: string;
  enableDataflow?: boolean;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV22 {
  private options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions = {}) {
    this.options = {
      graphType: "graph",
      customStyles: {},
      defaultNodeStyle: "",
      enableDataflow: false,
      ...options,
    };
  }

  private generateNodeId(message: Message, index: number): string {
    const prefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentHash = message.content ? JSON.stringify(message.content) : "empty";
    return `${prefix}_${index}_${Math.random().toString(36).substring(2, 5)}`;
  }

  private renderTextBlock(block: TextBlock, nodeId: string): string {
    return `    ${nodeId}["${block.text}"];`;
  }

  private renderToolUseBlock(block: ToolUseBlock, nodeId: string): string {
    const inputStr = JSON.stringify(block.input);
    return `    ${nodeId}["Tool: ${block.name}\\nInput: ${inputStr}"];`;
  }

  private renderThinkingBlock(block: ThinkingBlock, nodeId: string): string {
    return `    ${nodeId}["Thinking: ${block.thinking}"];`;
  }

  private renderContentBlock(block: ContentBlock, nodeId: string): string {
    switch (block.type) {
      case "text":
        return this.renderTextBlock(block as TextBlock, nodeId);
      case "tool_use":
        return this.renderToolUseBlock(block as ToolUseBlock, nodeId);
      case "thinking":
        return this.renderThinkingBlock(block as ThinkingBlock, nodeId);
      default:
        return "";
    }
  }

  private renderMessageNodes(message: Message, index: number, nodes: string[], edges: string[]): { nodes: string[]; edges: string[] } {
    const nodeId = this.generateNodeId(message, index);
    let nodeCode = "";

    if (Array.isArray(message.content)) {
      const contentBlocks = message.content as ContentBlock[];
      contentBlocks.forEach((block, i) => {
        nodeCode += this.renderContentBlock(block, nodeId);
      });
    } else if (typeof message.content === 'string') {
      // Handle simple string content if necessary, though types suggest ContentBlock[]
      nodeCode += `    ${nodeId}["${message.content}"];`;
    }

    nodes.push(nodeCode);

    // Simple edge logic: Connect to previous message if available (simplified for this scope)
    if (index > 0) {
      const previousMessage = message.role === "assistant" ? message : (message.role === "user" ? message : null);
      if (previousMessage) {
        const prevNodeId = this.generateNodeId(previousMessage, index - 1);
        edges.push(`${prevNodeId} --> ${nodeId}: Response`);
      }
    }

    return { nodes: nodes, edges: edges };
  }

  public generateMermaidCode(messages: Message[]): string {
    const nodes: string[] = [];
    const edges: string[] = [];
    let graphDefinition = "";

    const graphType = this.options.graphType || "graph";
    const graphTitle = `Tool Call Dependency Graph (${graphType})`;

    graphDefinition += `graph ${graphType} ${graphTitle} {\n`;

    let messageIndex = 0;
    for (const message of messages) {
      const { nodes: newNodes, edges: newEdges } = this.renderMessageNodes(message, messageIndex++, nodes, edges);
      nodes.push(...newNodes);
      edges.push(...newEdges);
    }

    // Apply custom styling/defaults
    const styleDirectives = this.options.customStyles ? Object.entries(this.options.customStyles).map(([key, value]) => `${key} { ${value} }`).join('\n') : "";
    const defaultStyle = this.options.defaultNodeStyle ? `classDef defaultStyle fill:#eee,stroke:#333,stroke-width:2px;` : "";

    graphDefinition += "\n" + nodes.join('\n') + "\n";
    graphDefinition += edges.join('\n') + "\n";

    if (styleDirectives || defaultStyle) {
      graphDefinition += "\n" + defaultStyle + "\n" + styleDirectives;
    }

    graphDefinition += "}\n";

    return graphDefinition;
  }
}