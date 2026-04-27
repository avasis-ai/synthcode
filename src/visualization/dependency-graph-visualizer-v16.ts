import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ResourceConstraint {
  resourceId: string;
  minCapacity: number;
  maxCapacity: number;
}

export interface TemporalEdge {
  sourceNodeId: string;
  targetNodeId: string;
  startTimeWindow: { start: number; end: number };
  duration: number;
  resourceUsage: Record<string, { usage: number; requiredCapacity: number }>;
}

interface Node {
  id: string;
  type: "tool_execution" | "user_input" | "system_process";
  name: string;
  metadata: Record<string, unknown>;
}

interface DependencyGraph {
  nodes: Node[];
  edges: TemporalEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV16 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private calculateResourceViolations(edge: TemporalEdge, constraints: ResourceConstraint[]): Record<string, { violated: boolean; details: string }> {
    const violations: Record<string, { violated: boolean; details: string }> = {};
    const resourceUsage = edge.resourceUsage;

    for (const constraint of constraints) {
      const resourceId = constraint.resourceId;
      const usage = resourceUsage[resourceId];

      if (usage) {
        const violated = usage.usage > constraint.maxCapacity || usage.requiredCapacity > constraint.minCapacity;
        let details = "";
        if (violated) {
          details = `Resource ${resourceId} exceeded capacity. Usage: ${usage.usage}, Max: ${constraint.maxCapacity}. Required: ${usage.requiredCapacity}, Min: ${constraint.minCapacity}.`;
        } else {
          details = `Resource ${resourceId} within bounds. Usage: ${usage.usage}, Max: ${constraint.maxCapacity}.`;
        }
        violations[resourceId] = { violated, details };
      } else {
        violations[resourceId] = { violated: false, details: `Resource ${resourceId} not explicitly used.` };
      }
    }
    return violations;
  }

  private renderTemporalEdge(edge: TemporalEdge, constraints: ResourceConstraint[]): { element: string; style: Record<string, string> } {
    const violations = this.calculateResourceViolations(edge, constraints);
    let violationIndicator = "";
    let hasViolation = false;

    for (const resourceId in violations) {
      if (violations[resourceId].violated) {
        hasViolation = true;
        violationIndicator += `[${resourceId} VIOLATION] `;
      }
    }

    const baseStyle: Record<string, string> = {
      stroke: hasViolation ? "red" : "blue",
      strokeWidth: "2px",
      transition: "all 0.3s",
    };

    const finalStyle: Record<string, string> = {
      ...baseStyle,
      opacity: 0.8,
    };

    return {
      element: `arc(${edge.sourceNodeId}, ${edge.targetNodeId})`,
      style: {
        ...finalStyle,
        content: `${violationIndicator} Time: ${edge.startTimeWindow.start}-${edge.startTimeWindow.end}`,
      },
    };
  }

  public visualize(constraints: ResourceConstraint[]): { nodes: any[]; edges: any[] } {
    const renderedNodes: any[] = this.graph.nodes.map(node => ({
      id: node.id,
      label: node.name,
      type: node.type,
      metadata: node.metadata,
    }));

    const renderedEdges: any[] = this.graph.edges.map(edge => this.renderTemporalEdge(edge, constraints));

    return {
      nodes: renderedNodes,
      edges: renderedEdges,
    };
  }
}