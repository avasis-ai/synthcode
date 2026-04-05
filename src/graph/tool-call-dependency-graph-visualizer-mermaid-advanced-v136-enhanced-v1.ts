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
  metadata?: Record<string, any>;
  type: "user" | "assistant" | "tool";
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  metadata?: Record<string, any>;
  condition?: string;
}

export type DependencyGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export class MermaidGraphVisualizer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeDefinition(node: GraphNode): string {
    let definition = `    ${node.id}["${node.label}"]`;
    if (node.metadata) {
      definition += `\n    ${node.id}:::${node.type}Style`;
    }
    return definition;
  }

  private getEdgeDefinition(edge: GraphEdge): string {
    let definition = `    ${edge.from} --> ${edge.to}["${edge.label}"]`;
    if (edge.condition) {
      definition += `\n    ${edge.from} -- "${edge.condition}" --> ${edge.to}`;
    }
    return definition;
  }

  private generateStyleDefinitions(): string {
    let styles = "";
    const nodeTypes: Record<"user" | "assistant" | "tool", string> = {
      user: "User",
      assistant: "Assistant",
      tool: "ToolResult",
    };

    styles += "classDef UserStyle fill:#e6e6ff,stroke:#6a5acd,stroke-width:2px;\n";
    styles += "classDef AssistantStyle fill:#d1e7dd,stroke:#0f5132,stroke-width:2px;\n";
    styles += "classDef ToolResultStyle fill:#fff3cd,stroke:#6c757d,stroke-width:2px;\n";

    return styles;
  }

  public renderMermaid(graph: DependencyGraph): string {
    if (!graph || !graph.nodes.length && !graph.edges.length) {
      return "graph TD\n    %% No graph data provided.";
    }

    let mermaidString = "graph TD\n";

    // 1. Node Definitions
    let nodeDefs = graph.nodes.map(this.getNodeDefinition).join("\n");
    mermaidString += "\n%% Nodes\n" + nodeDefs + "\n";

    // 2. Edge Definitions
    let edgeDefs = graph.edges.map(this.getEdgeDefinition).join("\n");
    mermaidString += "\n%% Edges\n" + edgeDefs + "\n";

    // 3. Styling and Classes
    mermaidString += "\n%% Styling\n";
    mermaidString += this.generateStyleDefinitions();

    // 4. Apply Classes (Simplified for this advanced version, assuming node.type maps to classDef)
    let classApplications = graph.nodes.map(node => `class ${node.id} ${node.type}Style;`).join("\n");
    mermaidString += "\n%% Class Assignments\n" + classApplications + "\n";

    return mermaidString.trim();
  }
}

export const createDependencyGraphVisualizer = (graph: DependencyGraph): string => {
  const visualizer = new MermaidGraphVisualizer(graph);
  return visualizer.renderMermaid(graph);
};