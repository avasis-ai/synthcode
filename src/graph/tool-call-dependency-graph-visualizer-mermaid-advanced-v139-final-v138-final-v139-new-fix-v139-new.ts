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

interface DependencyNode {
  id: string;
  label: string;
  type: "start" | "tool_call" | "conditional" | "end";
  metadata?: Record<string, any>;
}

interface DependencyEdge {
  from: string;
  to: string;
  condition?: string;
  isLoop?: boolean;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
  private nodes: DependencyNode[];
  private edges: DependencyEdge[];

  constructor(nodes: DependencyNode[], edges: DependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeId(node: DependencyNode): string {
    return node.id;
  }

  private getMermaidNodeId(nodeId: string): string {
    return `N${nodeId.replace(/[^a-zA-Z0-9]/g, "")}`;
  }

  private getMermaidLabel(node: DependencyNode): string {
    switch (node.type) {
      case "start":
        return "Start";
      case "tool_call":
        return `Tool: ${node.metadata?.toolName || "Unknown Tool"}`;
      case "conditional":
        return `Condition: ${node.metadata?.condition || "Check"}`;
      case "end":
        return "End";
      default:
        return node.label;
    }
  }

  private generateNodeDefinitions(): string {
    const definitions: string[] = this.nodes.map((node) => {
      const id = this.getMermaidNodeId(this.getNodeId(node));
      const label = this.getMermaidLabel(node);
      let definition = `${id}["${label}"]`;

      if (node.type === "tool_call" && node.metadata?.toolName) {
        definition += `\n  style ${id} fill:#f9f,stroke:#333,stroke-width:2px`;
      } else if (node.type === "conditional") {
        definition += `\n  style ${id} fill:#ccf,stroke:#333,stroke-width:2px`;
      } else if (node.type === "start") {
        definition += `\n  style ${id} fill:#afa,stroke:#333,stroke-width:2px`;
      } else if (node.type === "end") {
        definition += `\n  style ${id} fill:#faa,stroke:#333,stroke-width:2px`;
      }
      return definition;
    });
    return definitions.join("\n");
  }

  private generateEdgeDefinitions(): string {
    const definitions: string[] = this.edges.map((edge) => {
      const fromId = this.getMermaidNodeId(this.getNodeId(edge.from));
      const toId = this.getMermaidNodeId(this.getNodeId(edge.to));
      let edge = `${fromId} --> ${toId}`;

      if (edge.condition) {
        edge += `\n    -- ${edge.condition} --`;
      } else if (edge.isLoop) {
        edge += `\n    -- Loop Back --`;
      }
      return edge;
    });
    return definitions.join("\n");
  }

  private sanitizeMermaidString(mermaid: string): string {
    return mermaid.trim().replace(/\s+/g, ' ');
  }

  public visualizeGraph(): string {
    const nodeDefs = this.generateNodeDefinitions();
    const edgeDefs = this.generateEdgeDefinitions();

    const mermaidGraph = `graph TD\n\n${nodeDefs}\n\n${edgeDefs}`;

    return this.sanitizeMermaidString(mermaidGraph);
  }
}