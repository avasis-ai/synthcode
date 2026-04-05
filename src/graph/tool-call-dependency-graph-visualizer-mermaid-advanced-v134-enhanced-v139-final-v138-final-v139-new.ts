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

export interface GraphNode {
  id: string;
  label: string;
  type: "start" | "process" | "tool_call" | "decision" | "end";
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  condition?: string;
}

export interface GraphContext {
  nodes: GraphNode[];
  edges: GraphEdge[];
  messages: Message[];
}

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeDefinition(node: GraphNode): string {
    let definition = `    ${node.id}["${node.label}"]`;

    if (node.metadata) {
      const metaString = Object.entries(node.metadata)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join("; ");
      definition += `\n    style ${node.id} fill:#f9f,stroke:#333,stroke-width:2px,label-metadata("${metaString}")`;
    }

    return definition;
  }

  private generateEdgeDefinition(edge: GraphEdge): string {
    let definition = `    ${edge.from} --> ${edge.to}`;

    if (edge.condition) {
      definition += `\n    ${edge.from} -- "${edge.condition}" --> ${edge.to}`;
    } else {
      definition += `\n    ${edge.from} --> ${edge.to}`;
    }
    return definition;
  }

  private generateMermaidGraph(): string {
    let mermaid = "graph TD\n";

    const nodeDefinitions = this.context.nodes.map(this.generateNodeDefinition).join("\n");
    const edgeDefinitions = this.context.edges.map(this.generateEdgeDefinition).join("\n");

    mermaid += "\n%% --- Node Definitions ---\n";
    mermaid += nodeDefinitions + "\n";

    mermaid += "\n%% --- Edge Definitions ---\n";
    mermaid += edgeDefinitions + "\n";

    mermaid += "\n%% --- Styling & Directives ---\n";
    mermaid += "%% Advanced styling for flow control and metadata visualization\n";
    mermaid += "classDef start fill:#aaffaa,stroke:#3c3;classDef end fill:#ffaaaa,stroke:#c33;classDef decision fill:#ffffaa,stroke:#cc0;classDef tool_call fill:#cceeff,stroke:#007bff;\n";

    return mermaid;
  }

  public renderMermaidGraph(): string {
    return this.generateMermaidGraph();
  }
}