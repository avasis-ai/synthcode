import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ExecutionStatus = "SUCCESS" | "FAILURE" | "SKIPPED" | "PENDING";

interface StatusMap {
  [key: string]: ExecutionStatus;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV2 {
  private statusMap: StatusMap;

  constructor(statusMap: StatusMap) {
    this.statusMap = statusMap;
  }

  private getNodeStyle(status: ExecutionStatus): string {
    switch (status) {
      case "SUCCESS":
        return "style fill:#d4edda,stroke:#c3e6cb,stroke-width:2px";
      case "FAILURE":
        return "style fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px";
      case "SKIPPED":
        return "style fill:#fff3cd,stroke:#ffeeba,stroke-width:2px";
      case "PENDING":
      default:
        return "style fill:#e2e3e5,stroke:#d6d8db,stroke-width:2px";
    }
  }

  private getEdgeStyle(status: ExecutionStatus): string {
    switch (status) {
      case "SUCCESS":
        return "stroke:#28a745,stroke-dasharray:none";
      case "FAILURE":
        return "stroke:#dc3545,stroke-dasharray:5,2";
      case "SKIPPED":
        return "stroke:#ffc107,stroke-dasharray:5,2";
      case "PENDING":
      default:
        return "stroke:#6c757d,stroke-dasharray:1,2";
    }
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const toolId = typeof message.tool_use_id === 'string' ? message.tool_use_id.substring(0, 4) : "";
    return `${rolePrefix}-${toolId}-${index}`;
  }

  private generateNodeLabel(message: Message, index: number): string {
    if (message.role === "user") {
      return `User Input ${index}`;
    }
    if (message.role === "assistant") {
      const toolUses = (message as AssistantMessage).content.filter((block): block is ToolUseBlock => block.type === "tool_use");
      if (toolUses.length > 0) {
        return `Assistant (Tools: ${toolUses.map(t => t.name).join(', ')})`;
      }
      return `Assistant Response ${index}`;
    }
    if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id.substring(0, 4)})`;
    }
    return `Node ${index}`;
  }

  private generateGraph(messages: Message[], toolCalls: { sourceIndex: number; targetToolId: string; sourceNodeId: string; targetNodeId: string }[]): string {
    let mermaidGraph = "graph TD;\n";
    const nodeStyles: Record<string, string> = {};
    const edgeStyles: Record<string, string> = {};

    // 1. Define Nodes
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const nodeId = this.generateNodeId(message, i);
      const label = this.generateNodeLabel(message, i);
      const status = this.statusMap[nodeId] || "PENDING";
      const style = this.getNodeStyle(status);
      mermaidGraph += `${nodeId}["${label}"]${style};\n`;
      nodeStyles[nodeId] = style;
    }

    // 2. Define Edges
    for (const call of toolCalls) {
      const sourceId = call.sourceNodeId;
      const targetId = call.targetNodeId;
      
      // Determine edge status based on the target node's status (or a dedicated edge status if available)
      const targetStatus = this.statusMap[targetId] || "PENDING";
      const edgeStyle = this.getEdgeStyle(targetStatus);

      mermaidGraph += `${sourceId} -->|${targetStatus}| ${targetId}${edgeStyle};\n`;
      edgeStyles[`${sourceId}-${targetId}`] = edgeStyle;
    }

    // 3. Apply global styles (optional, but good practice)
    mermaidGraph += "\n%% Styling Notes\n";
    mermaidGraph += `classDef success fill:#d4edda,stroke:#c3e6cb,stroke-width:2px;\n`;
    mermaidGraph += `classDef failure fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px;\n`;
    mermaidGraph += `classDef skipped fill:#fff3cd,stroke:#ffeeba,stroke-width:2px;\n`;
    mermaidGraph += `classDef pending fill:#e2e3e5,stroke:#d6d8db,stroke-width:2px;\n`;

    return mermaidGraph;
  }

  /**
   * Generates the Mermaid graph definition string for tool call dependencies.
   * @param messages The sequence of messages in the conversation.
   * @param toolCalls A list of explicit dependencies (e.g., A calls B).
   * @returns The Mermaid graph definition string.
   */
  public visualize(messages: Message[], toolCalls: { sourceIndex: number; targetToolId: string; sourceNodeId: string; targetNodeId: string }[]): string {
    return this.generateGraph(messages, toolCalls);
  }
}