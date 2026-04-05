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

export type EdgeStyle = "SUCCESS" | "FAILURE" | "SKIPPED" | "PENDING";

export interface DependencyEdge {
  fromNodeId: string;
  toNodeId: string;
  style: EdgeStyle;
  condition?: string;
}

export interface ToolCallDependencyGraph {
  nodes: Record<string, { label: string; type: "tool_call" | "message"; details: any }>;
  edges: DependencyEdge[];
}

export class ToolCallDependencyGraphVisualizer {
  private graph: ToolCallDependencyGraph;

  constructor(graph: ToolCallDependencyGraph) {
    this.graph = graph;
  }

  private getEdgeStyleClass(style: EdgeStyle): string {
    switch (style) {
      case "SUCCESS":
        return "stroke:green;stroke-dasharray:none;";
      case "FAILURE":
        return "stroke:red;stroke-dasharray:5,5;";
      case "SKIPPED":
        return "stroke:gray;stroke-dasharray:2,2;";
      case "PENDING":
        return "stroke:blue;stroke-dasharray:10,5;";
      default:
        return "stroke:black;stroke-dasharray:none;";
    }
  }

  private generateMermaidGraph(graph: ToolCallDependencyGraph): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    for (const nodeId in graph.nodes) {
      const node = graph.nodes[nodeId];
      let labelContent = "";

      if (node.type === "tool_call") {
        const toolUse = node.details as ToolUseBlock;
        labelContent = `Tool: ${toolUse.name}\\nInput: ${JSON.stringify(toolUse.input).substring(0, 30)}...`;
      } else if (node.type === "message") {
        const message = node.details as { role: string; content: any[] };
        if (message.role === "user") {
          labelContent = `User Input: ${message.content[0]?.text?.text || "N/A"}`;
        } else if (message.role === "assistant") {
          const textBlocks = (message.content as ContentBlock[]).filter((b): b is TextBlock => b.type === "text");
          labelContent = `Assistant Response: ${textBlocks.map(tb => tb.text).join(" ")}...`;
        } else if (message.role === "tool") {
          const toolResult = message.details as ToolResultMessage;
          const errorStatus = toolResult.is_error ? "ERROR" : "SUCCESS";
          labelContent = `Tool Result (${toolResult.tool_use_id}): ${errorStatus}\\nContent: ${toolResult.content.substring(0, 30)}...`;
        }
      }

      mermaid += `  ${nodeId}["${labelContent}"]\n`;
    }

    // 2. Define Edges with Styling
    for (const edge of graph.edges) {
      const styleClass = this.getEdgeStyleClass(edge.style);
      let edgeDefinition = `${edge.fromNodeId} -->|${edge.condition || ''}| ${edge.toNodeId}`;
      mermaid += `  ${edgeDefinition} style ${edge.fromNodeId} -- ${edge.toNodeId} ${styleClass};\n`;
    }

    return mermaid;
  }

  public visualize(): string {
    return this.generateMermaidGraph(this.graph);
  }
}