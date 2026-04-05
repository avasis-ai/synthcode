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

interface GraphNode {
  id: string;
  label: string;
  type: "start" | "tool_call" | "conditional" | "loop" | "end";
  details?: Record<string, any>;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  condition?: string;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeDefinition(node: GraphNode): string {
    let definition = `node${node.id}["${node.label}"]`;

    if (node.type === "tool_call") {
      const toolUse = node.details?.tool_use as ToolUseBlock;
      if (toolUse) {
        definition += `\n    -- Tool: ${toolUse.name} --`;
      }
    } else if (node.type === "conditional") {
      definition += `\n    -- Condition --`;
    } else if (node.type === "loop") {
      definition += `\n    -- Loop Start/End --`;
    }

    return definition;
  }

  private getEdgeDefinition(edge: GraphEdge): string {
    let definition = `${edge.from} --> ${edge.to}`;
    if (edge.label) {
      definition += `\n    -- ${edge.label} --`;
    }
    if (edge.condition) {
      definition += `\n    {${edge.condition}}`;
    }
    return definition;
  }

  public renderMermaidGraph(): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    const nodeDefinitions = this.nodes.map(this.getNodeDefinition).join("\n");
    mermaid += "\n%% Nodes Definition\n" + nodeDefinitions + "\n";

    // 2. Define Edges
    const edgeDefinitions = this.edges.map(this.getEdgeDefinition).join("\n");
    mermaid += "\n%% Edges Definition\n" + edgeDefinitions + "\n";

    // 3. Add Styling/Metadata (Advanced Enhancements)
    mermaid += "\n%% Styling and Flow Control\n";
    mermaid += "classDef start fill:#ccffcc,stroke:#333,stroke-width:2px;\n";
    mermaid += "classDef end fill:#ffcccc,stroke:#333,stroke-width:2px;\n";
    mermaid += "classDef toolCall fill:#cceeff,stroke:#007bff,stroke-width:2px;\n";
    mermaid += "classDef conditional fill:#fff3cd,stroke:#ffc107,stroke-width:2px;\n";
    mermaid += "classDef loop fill:#e2e3e5,stroke:#6c757d,stroke-width:2px;\n";

    // Apply classes
    this.nodes.forEach(node => {
      let className = "";
      switch (node.type) {
        case "start":
          className = "start";
          break;
        case "end":
          className = "end";
          break;
        case "tool_call":
          className = "toolCall";
          break;
        case "conditional":
          className = "conditional";
          break;
        case "loop":
          className = "loop";
          break;
      }
      mermaid += `class node${node.id} ${className};\n`;
    });

    return mermaid.trim();
  }
}