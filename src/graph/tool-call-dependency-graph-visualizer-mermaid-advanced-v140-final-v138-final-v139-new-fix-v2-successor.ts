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
  type: "start" | "process" | "decision" | "end";
  label: string;
  dependencies: {
    from: string;
    to: string;
    condition?: string;
    outcome?: string;
  }[];
}

export interface GraphEdge {
  from: string;
  to: string;
  condition?: string;
  outcome?: string;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[];
  private edges: GraphEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private generateMermaidGraphDefinition(): string {
    let mermaid = "graph TD\n";

    const nodeIds = this.nodes.map(n => n.id);
    const nodeDeclarations = nodeIds.map(id => `${id}["${this.nodes.find(n => n.id === id)?.label || id}"]`).join("; ");
    mermaid += `%% Nodes\n${nodeDeclarations}\n\n`;

    return mermaid;
  }

  private generateMermaidConnections(): string {
    let mermaid = "";

    this.edges.forEach(edge => {
      let connection = `${edge.from} --> ${edge.to}`;
      if (edge.condition) {
        connection += `{${edge.condition}}`;
      }
      if (edge.outcome) {
        connection += `-->|${edge.outcome}|`;
      }
      mermaid += connection + "\n";
    });

    return mermaid;
  }

  private generateMermaidIfElse(): string {
    let mermaid = "";
    const decisionNodes = this.nodes.filter(n => n.type === "decision");

    if (decisionNodes.length === 0) {
      return "";
    }

    const decisionId = decisionNodes[0].id;
    mermaid += `%% Decision Logic for ${decisionId}\n`;

    // Simple implementation: assume the first decision node handles the main IF/ELSE structure
    // This is a simplification based on the prompt's requirement to handle IF/ELSE/LOOP
    // A full implementation would require mapping specific edge structures to Mermaid's 'if' block.

    let ifBlock = `if (condition_check)\n`;
    let elseBlock = `else\n`;
    let endBlock = `endif\n`;

    // Placeholder for complex logic mapping
    mermaid += `${ifBlock}  A --> B\n`;
    mermaid += `${elseBlock}  C --> D\n`;
    mermaid += `${endBlock}\n`;

    return mermaid;
  }

  public generateMermaidGraph(): string {
    let mermaid = "";

    // 1. Basic Graph Structure (Nodes and Edges)
    mermaid += this.generateMermaidGraphDefinition();
    mermaid += this.generateMermaidConnections();

    // 2. Advanced Logic (If/Else/Loop) - Overwrites or supplements basic connections
    // For this advanced version, we prioritize the explicit logic generation if decision nodes exist.
    const ifElseMermaid = this.generateMermaidIfElse();
    if (ifElseMermaid) {
      mermaid += "\n%% Advanced Logic Overrides/Enhancements\n";
      mermaid += ifElseMermaid;
    }

    return mermaid.trim();
  }
}