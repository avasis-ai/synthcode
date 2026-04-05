import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type ToolCallMetadata = {
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  guardStatus: "passed" | "failed" | "skipped";
};

export interface GraphNode {
  id: string;
  message: Message;
  metadata: ToolCallMetadata;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: {
    source: string;
    target: string;
    type: "control" | "data";
    description: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerAdvanced {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  public visualizeMermaid(): string {
    let mermaidCode = "graph TD;\n";

    this.graph.nodes.forEach(node => {
      const nodeId = node.id;
      const label = this.formatNodeLabel(node.message);
      mermaidCode += `  ${nodeId}["${label}"]\n`;
    });

    this.graph.edges.forEach(edge => {
      let edgeType = "";
      let style = "";

      if (edge.type === "data") {
        edgeType = "-->|Data: " + edge.description + "|";
        style = "stroke: blue,stroke-width:2px;";
      } else {
        edgeType = "-->|Control|";
        style = "stroke: gray,stroke-width:1px;";
      }

      mermaidCode += `  ${edge.source} ${edgeType} ${edge.target} ${style}\n`;
    });

    return mermaidCode;
  }

  private formatNodeLabel(message: Message): string {
    if (message.role === "user") {
      return `User: ${message.content.substring(0, 30)}...`;
    }
    if (message.role === "assistant") {
      const toolUses = (message as any).content?.filter((block: ContentBlock) => block.type === "tool_use") as ToolUseBlock[];
      if (toolUses.length > 0) {
        return `Assistant (Tools: ${toolUses.length})`;
      }
      return `Assistant: ${message.content.substring(0, 30)}...`;
    }
    if (message.role === "tool") {
      const isError = (message as any).is_error ? "ERROR" : "Result";
      return `Tool Result (${message.tool_use_id}): ${isError}`;
    }
    return "Unknown Message";
  }

  public visualizeSvg(mermaidCode: string): string {
    return `<!-- Mermaid Diagram Placeholder -->\n${mermaidCode}\n<!-- End Mermaid Diagram -->`;
  }
}