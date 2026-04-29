import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface Constraint {
  type: "time" | "resource";
  value: number;
  unit?: "seconds" | "milliseconds";
}

export interface NodePayload {
  id: string;
  type: "component" | "process";
  constraints?: Constraint[];
  metadata?: Record<string, unknown>;
}

export interface EdgePayload {
  sourceId: string;
  targetId: string;
  constraints?: Constraint[];
  weight?: number;
}

export interface GraphPayload {
  nodes: NodePayload[];
  edges: EdgePayload[];
}

export class ContextualDependencyGraphVisualizerAdvanced {
  private graphPayload: GraphPayload;

  constructor(graphPayload: GraphPayload) {
    this.graphPayload = graphPayload;
  }

  private calculateEdgeStyle(edge: EdgePayload): { color: string; thickness: number; } {
    let baseColor = "#ccc";
    let thickness = 1;

    if (edge.constraints) {
      const timeConstraint = edge.constraints.find(c => c.type === "time");
      const resourceConstraint = edge.constraints.find(c => c.type === "resource");

      if (timeConstraint) {
        baseColor = "rgba(255, 99, 132, 0.8)"; // Reddish for time
        thickness += 2;
      }
      if (resourceConstraint) {
        baseColor = "rgba(54, 162, 235, 0.8)"; // Bluish for resource
        thickness += 2;
      }
    }
    return { color: baseColor, thickness: Math.min(5, thickness + 1) };
  }

  private calculateNodeStyle(node: NodePayload): { fillColor: string; borderColor: string; } {
    let fillColor = "#e0f7fa";
    let borderColor = "#00bcd4";

    if (node.constraints) {
      const timeConstraint = node.constraints.find(c => c.type === "time");
      const resourceConstraint = node.constraints.find(c => c.type === "resource");

      if (timeConstraint) {
        fillColor = "rgba(255, 159, 64, 0.8)"; // Orange for time
      }
      if (resourceConstraint) {
        fillColor = "rgba(75, 192, 192, 0.8)"; // Teal for resource
      }
    }
    return { fillColor, borderColor };
  }

  public visualize(
    onNodeRender: (node: NodePayload, style: { fillColor: string; borderColor: string; }) => void,
    onEdgeRender: (edge: EdgePayload, style: { color: string; thickness: number; }) => void
  ): void {
    console.log("--- Starting Advanced Contextual Dependency Graph Visualization ---");

    this.graphPayload.nodes.forEach((node, index) => {
      const style = this.calculateNodeStyle(node);
      onNodeRender(node, style);
    });

    this.graphPayload.edges.forEach((edge, index) => {
      const style = this.calculateEdgeStyle(edge);
      onEdgeRender(edge, style);
    });

    console.log("--- Visualization Complete ---");
  }

  public filterByConstraintViolation(
    violationType: "time" | "resource",
    threshold: number
  ): GraphPayload {
    const filteredNodes: NodePayload[] = this.graphPayload.nodes.filter(node => {
      if (!node.constraints) return false;
      const violation = node.constraints.find(c => c.type === violationType && c.value > threshold);
      return !!violation;
    });

    const filteredEdges: EdgePayload[] = this.graphPayload.edges.filter(edge => {
      if (!edge.constraints) return false;
      const violation = edge.constraints.find(c => c.type === violationType && c.value > threshold);
      return !!violation;
    });

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }
}