import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceConstraint {
  resourceId: string;
  requiredBy: string;
  minDurationMs: number;
  maxDurationMs: number;
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

export interface GraphNode {
  id: string;
  type: "tool_call" | "data_source" | "user_input";
  metadata: Record<string, unknown>;
  temporal?: TemporalMetadata;
  resourceConstraints?: ResourceConstraint[];
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  type: "data_flow" | "control_flow";
  metadata: {
    dependencyType: "direct" | "indirect";
    weight: number;
  };
  temporal?: {
    delayMs: number;
    constraint: string;
  };
}

export class DependencyGraphVisualizerV13 {
  private nodes: GraphNode[];
  private edges: DependencyEdge[];

  constructor(nodes: GraphNode[], edges: DependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private processTemporalEdge(edge: DependencyEdge): string {
    if (!edge.temporal) {
      return "";
    }
    return `[Temporal: ${edge.temporal.delayMs}ms delay, Constraint: ${edge.temporal.constraint}]`;
  }

  private renderNode(node: GraphNode): string {
    let output = `Node ${node.id} (${node.type}):\n`;
    if (node.temporal) {
      output += `  [Time]: ${node.temporal.startTimeMs}ms to ${node.temporal.endTimeMs}ms (Duration: ${node.temporal.durationMs}ms)\n`;
    }
    if (node.resourceConstraints && node.resourceConstraints.length > 0) {
      output += "  [Resources]:\n";
      node.resourceConstraints.forEach(rc => {
        output += `    - ${rc.resourceId} required by ${rc.requiredBy} (${rc.minDurationMs}-${rc.maxDurationMs}ms)\n`;
      });
    }
    return output;
  }

  private renderEdge(edge: DependencyEdge): string {
    let output = `Edge ${edge.sourceId} -> ${edge.targetId} (${edge.metadata.dependencyType}):\n`;
    output += `  [Weight]: ${edge.metadata.weight}\n`;
    if (edge.temporal) {
      output += `  ${this.processTemporalEdge(edge)}\n`;
    }
    return output;
  }

  public visualizeGraph(): string {
    let visualization = "--- Dependency Graph Visualization (V13) ---\n\n";

    visualization += "--- Nodes ---\n";
    this.nodes.forEach(node => {
      visualization += this.renderNode(node) + "\n";
    });

    visualization += "\n--- Edges ---\n";
    this.edges.forEach(edge => {
      visualization += this.renderEdge(edge) + "\n";
    });

    visualization += "\n--- Visualization Complete ---";
    return visualization;
  }
}