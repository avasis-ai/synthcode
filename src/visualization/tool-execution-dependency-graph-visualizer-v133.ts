import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: string;
}

export interface TimeWindow {
  startTimeMs: number;
  endTimeMs: number;
}

export interface ResourceConstraintNode {
  nodeId: string;
  resourceConstraints: ResourceConstraint[];
  timeWindow: TimeWindow;
}

export interface TemporalEdge {
  sourceId: string;
  targetId: string;
  durationMs: number;
  resourceUsage: ResourceConstraint[];
}

export interface GraphPayload {
  nodes: Record<string, ResourceConstraintNode>;
  edges: TemporalEdge[];
}

export class ToolExecutionDependencyGraphVisualizer {
  private payload: GraphPayload;

  constructor(payload: GraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): void {
    console.log("Rendering Tool Execution Dependency Graph...");
    this.renderNodes();
    this.renderEdges();
    console.log("Graph rendering complete.");
  }

  private renderNodes(): void {
    console.log("--- Rendering Nodes ---");
    for (const nodeId in this.payload.nodes) {
      const node = this.payload.nodes[nodeId];
      console.log(`Node ID: ${nodeId}`);
      console.log(`  Time Window: [${node.timeWindow.startTimeMs}ms - ${node.timeWindow.endTimeMs}ms]`);
      console.log("  Resource Constraints:");
      node.resourceConstraints.forEach(rc => {
        console.log(`    - ${rc.resourceName}: ${rc.requiredAmount}${rc.unit}`);
      });
    }
  }

  private renderEdges(): void {
    console.log("\n--- Rendering Edges ---");
    for (const edge of this.payload.edges) {
      console.log(`Edge: ${edge.sourceId} -> ${edge.targetId}`);
      console.log(`  Duration: ${edge.durationMs}ms`);
      console.log("  Resource Usage:");
      edge.resourceUsage.forEach(rc => {
        console.log(`    - ${rc.resourceName}: ${rc.requiredAmount}${rc.unit}`);
      });
    }
  }

  public static createMockPayload(): GraphPayload {
    const mockNodes: Record<string, ResourceConstraintNode> = {
      "start": {
        nodeId: "start",
        resourceConstraints: [{ resourceName: "CPU", requiredAmount: 1, unit: "core" }],
        timeWindow: { startTimeMs: 0, endTimeMs: 1000 },
      },
      "toolA": {
        nodeId: "toolA",
        resourceConstraints: [{ resourceName: "Memory", requiredAmount: 4, unit: "GB" }],
        timeWindow: { startTimeMs: 1000, endTimeMs: 3000 },
      },
      "toolB": {
        nodeId: "toolB",
        resourceConstraints: [{ resourceName: "CPU", requiredAmount: 2, unit: "core" }],
        timeWindow: { startTimeMs: 3000, endTimeMs: 5000 },
      },
      "end": {
        nodeId: "end",
        resourceConstraints: [],
        timeWindow: { startTimeMs: 5000, endTimeMs: 6000 },
      },
    };

    const mockEdges: TemporalEdge[] = [
      {
        sourceId: "start",
        targetId: "toolA",
        durationMs: 2000,
        resourceUsage: [{ resourceName: "Network", requiredAmount: 0.5, unit: "Mbps" }],
      },
      {
        sourceId: "toolA",
        targetId: "toolB",
        durationMs: 2000,
        resourceUsage: [{ resourceName: "Memory", requiredAmount: 2, unit: "GB" }],
      },
      {
        sourceId: "toolB",
        targetId: "end",
        durationMs: 1000,
        resourceUsage: [{ resourceName: "CPU", requiredAmount: 1, unit: "core" }],
      },
    ];

    return { nodes: mockNodes, edges: mockEdges };
  }
}