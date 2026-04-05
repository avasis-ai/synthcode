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

export type DependencyNode = {
  id: string;
  type: "start" | "tool_call" | "conditional" | "fallback" | "end";
  label: string;
  metadata: Record<string, any>;
};

export type DependencyEdge = {
  from: string;
  to: string;
  label: string;
  type: "success" | "condition" | "fallback";
  condition?: string;
};

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV31 {
  private nodes: DependencyNode[];
  private edges: DependencyEdge[];

  constructor(nodes: DependencyNode[], edges: DependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeDefinition(node: DependencyNode): string {
    const baseId = node.id;
    let definition = `    ${baseId}["${node.label}"]`;

    if (node.type === "tool_call") {
      const toolUse = node.metadata.tool_use as ToolUseBlock;
      if (toolUse) {
        definition += `\n    --> Tool: ${toolUse.name}\\n    Input: ${JSON.stringify(toolUse.input)}`;
      }
    } else if (node.type === "conditional") {
      definition += `\n    (Condition: ${node.metadata.condition || "N/A"})`;
    } else if (node.type === "fallback") {
      definition += `\n    (Fallback Path)`;
    }

    return definition;
  }

  private getEdgeDefinition(edge: DependencyEdge): string {
    let definition = "";
    let arrow = "-->";
    let label = edge.label;

    if (edge.type === "condition") {
      arrow = "--";
      label = `[${edge.condition || "Condition"}]`;
    } else if (edge.type === "fallback") {
      arrow = "--";
      label = `[Fallback]`;
    }

    return `    ${edge.from} ${arrow} ${edge.to} ${label};`;
  }

  public generateMermaidGraph(): string {
    let mermaid = "graph TD;\n";

    // 1. Define all nodes
    const nodeDefinitions = this.nodes.map(this.getNodeDefinition).join("\n");
    mermaid += "\n%% --- Node Definitions ---\n" + nodeDefinitions + "\n";

    // 2. Define all edges
    const edgeDefinitions = this.edges.map(this.getEdgeDefinition).join("\n");
    mermaid += "\n%% --- Edge Definitions ---\n" + edgeDefinitions + "\n";

    // 3. Add metadata/styling notes for advanced visualization
    mermaid += "\n%% --- Visualization Notes ---\n";
    mermaid += "%% Conditional nodes use specific styling or labels to indicate branching logic.\n";
    mermaid += "%% Fallback paths are explicitly marked for error handling visualization.\n";

    return mermaid.trim();
  }
}