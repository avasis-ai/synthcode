import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface GraphContext {
  messages: Message[];
  initialState: string;
  finalState: string;
}

export interface NodeDefinition {
  id: string;
  label: string;
  type: "start" | "process" | "tool_call" | "state";
  details?: Record<string, unknown>;
}

export interface EdgeDefinition {
  from: string;
  to: string;
  label: string;
  condition?: string;
}

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;
  private nodes: NodeDefinition[] = [];
  private edges: EdgeDefinition[] = [];

  constructor(context: GraphContext) {
    this.context = context;
  }

  private mapStateToStyle(state: string): string {
    switch (state.toUpperCase()) {
      case "SUCCESS":
        return "fill:#d4edda,stroke:#c3e6cb";
      case "FAILURE":
        return "fill:#f8d7da,stroke:#f5c6cb";
      case "WAITING":
        return "fill:#fff3cd,stroke:#ffeeba";
      default:
        return "fill:#e2e3e5,stroke:#dee2e6";
    }
  }

  private generateNodeId(prefix: string, index: number): string {
    return `${prefix}-${index}`;
  }

  private buildNodes(nodes: NodeDefinition[]): string {
    return nodes.map(node => {
      const style = node.type === "state" ? `style ${node.id} fill:${this.mapStateToStyle(node.details?.state || "UNKNOWN")}` : "";
      return `${node.id}["${node.label}"]${style}`;
    }).join('\n');
  }

  private buildEdges(edges: EdgeDefinition[]): string {
    return edges.map(edge => {
      const conditionLabel = edge.condition ? `\n    --${edge.condition}-->` : '';
      return `${edge.from} --> ${edge.to} : "${edge.label}"${conditionLabel}`;
    }).join('\n');
  }

  public visualize(nodes: NodeDefinition[], edges: EdgeDefinition[]): string {
    this.nodes = nodes;
    this.edges = edges;

    const mermaidNodes = this.buildNodes(nodes);
    const mermaidEdges = this.buildEdges(edges);

    const graphDefinition = `graph TD\n${mermaidNodes}\n\n${mermaidEdges}`;

    return `mermaid\n${graphDefinition}`;
  }

  public visualizeWithContext(nodes: NodeDefinition[], edges: EdgeDefinition[]): string {
    const mermaidNodes = this.buildNodes(nodes);
    const mermaidEdges = this.buildEdges(edges);

    const graphDefinition = `graph TD\n${mermaidNodes}\n\n${mermaidEdges}`;

    return `mermaid\n${graphDefinition}`;
  }
}