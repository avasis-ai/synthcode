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
  graphTitle: string;
  defaultNodeClass?: string;
  defaultEdgeClass?: string;
  layoutHint?: "LR" | "TD" | "TB";
  customStyles?: Record<string, string>;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV120 {
  private options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions = {}) {
    this.options = {
      graphTitle: "Tool Call Dependency Graph",
      defaultNodeClass: "node",
      defaultEdgeClass: "edge",
      layoutHint: "LR",
      customStyles: {},
      ...options,
    };
  }

  private getNodeLabel(message: Message): string {
    if ("tool_use_id" in message && typeof message.tool_use_id === "string") {
      const toolMessage = message as ToolResultMessage;
      return `Tool Result (${toolMessage.tool_use_id})`;
    }
    if ("content" in message && Array.isArray(message.content)) {
      const assistantMessage = message as AssistantMessage;
      const textBlocks = assistantMessage.content.filter((c): c is TextBlock => c.type === "text");
      if (textBlocks.length > 0) {
        return `Assistant (${textBlocks[0].text.substring(0, 20)}...)`;
      }
      return "Assistant Response";
    }
    if ("content" in message && typeof message.content === "string") {
      return `User Input`;
    }
    return "Unknown Message";
  }

  private generateNodeDefinition(message: Message, id: string): string {
    const label = this.getNodeLabel(message);
    let nodeDef = `${id}["${label}"]`;

    if (this.options.defaultNodeClass) {
      nodeDef += `:::${this.options.defaultNodeClass}`;
    }

    return nodeDef;
  }

  private generateEdgeDefinition(sourceId: string, targetId: string, relationship: string): string {
    let edgeDef = `${sourceId} --> ${targetId}`;
    if (this.options.defaultEdgeClass) {
      edgeDef += `:::${this.options.defaultEdgeClass}`;
    }
    return edgeDef;
  }

  public generateGraphString(messages: Message[]): string {
    if (!messages || messages.length === 0) {
      return "graph TD\n    A[No messages provided]";
    }

    const graphId = "Graph";
    let nodeDefinitions: string[] = [];
    let edgeDefinitions: string[] = [];

    // 1. Define Nodes
    messages.forEach((message, index) => {
      const nodeId = `M${index}`;
      nodeDefinitions.push(this.generateNodeDefinition(message, nodeId));
    });

    // 2. Define Edges (Simplified sequential flow for demonstration)
    for (let i = 0; i < messages.length - 1; i++) {
      const sourceId = `M${i}`;
      const targetId = `M${i + 1}`;
      const relationship = "Follows";
      edgeDefinitions.push(this.generateEdgeDefinition(sourceId, targetId, relationship));
    }

    // 3. Assemble Mermaid Syntax
    let mermaid = `graph ${this.options.layoutHint || "LR"} ${this.options.graphTitle}\n`;

    // Add custom CSS styles if provided
    if (Object.keys(this.options.customStyles || {}).length > 0) {
      mermaid += `classDef customStyle fill:#f9f,stroke:#333,stroke-width:2px;\n`;
      Object.entries(this.options.customStyles).forEach(([key, value]) => {
        mermaid += `class ${key} ${value};\n`;
      });
    }

    // Add node definitions
    mermaid += nodeDefinitions.join("\n") + "\n";

    // Add edge definitions
    mermaid += edgeDefinitions.join("\n");

    return mermaid;
  }
}