import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: string;
}

interface TimeWindow {
  earliestStart: number;
  latestEnd: number;
}

interface GraphNode {
  id: string;
  type: "agent" | "tool";
  metadata: Record<string, unknown>;
  temporalConstraints?: TimeWindow[];
  resourceConstraints?: ResourceConstraint[];
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  metadata: Record<string, unknown>;
  temporalConstraints?: TimeWindow[];
  resourceConstraints?: ResourceConstraint[];
}

interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type RenderContext = {
  width: number;
  height: number;
};

export class ToolExecutionDependencyGraphVisualizerV23 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  public visualize(context: RenderContext): void {
    console.log("--- Starting Dependency Graph Visualization V23 ---");
    this.renderNodes(context);
    this.renderEdges(context);
    console.log("--- Visualization Complete ---");
  }

  private renderNodes(context: RenderContext): void {
    console.log(`Rendering ${this.graph.nodes.length} nodes within ${context.width}x${context.height}`);
    this.graph.nodes.forEach(node => {
      console.log(`  Node ${node.id} (${node.type}):`);
      if (node.temporalConstraints && node.temporalConstraints.length > 0) {
        console.log("    [Temporal Constraints]:", node.temporalConstraints);
      }
      if (node.resourceConstraints && node.resourceConstraints.length > 0) {
        console.log("    [Resource Constraints]:", node.resourceConstraints);
      }
    });
  }

  private renderEdges(context: RenderContext): void {
    console.log(`Rendering ${this.graph.edges.length} edges.`);
    this.graph.edges.forEach(edge => {
      console.log(`  Edge ${edge.sourceId} -> ${edge.targetId}:`);
      if (edge.temporalConstraints && edge.temporalConstraints.length > 0) {
        console.log("    [Temporal Constraints]:", edge.temporalConstraints);
      }
      if (edge.resourceConstraints && edge.resourceConstraints.length > 0) {
        console.log("    [Resource Constraints]:", edge.resourceConstraints);
      }
    });
  }

  public static createMockGraph(): DependencyGraph {
    const nodeA: GraphNode = {
      id: "A",
      type: "agent",
      metadata: { name: "Initial Agent Step" },
      temporalConstraints: [{ earliestStart: 0, latestEnd: 100 }],
      resourceConstraints: [{ resourceName: "CPU", requiredAmount: 1, unit: "core" }],
    };

    const nodeB: GraphNode = {
      id: "B",
      type: "tool",
      metadata: { name: "Tool Call X" },
      resourceConstraints: [{ resourceName: "Memory", requiredAmount: 512, unit: "MB" }],
    };

    const nodeC: GraphNode = {
      id: "C",
      type: "agent",
      metadata: { name: "Final Synthesis" },
      temporalConstraints: [{ earliestStart: 100, latestEnd: 200 }],
    };

    const edgeAB: GraphEdge = {
      sourceId: "A",
      targetId: "B",
      metadata: { dependency: "Sequential" },
      temporalConstraints: [{ earliestStart: 10, latestEnd: 50 }],
    };

    const edgeBC: GraphEdge = {
      sourceId: "B",
      targetId: "C",
      metadata: { dependency: "Conditional" },
      resourceConstraints: [{ resourceName: "Network", requiredAmount: 0.5, unit: "Gbps" }],
    };

    return {
      nodes: [nodeA, nodeB, nodeC],
      edges: [edgeAB, edgeBC],
    };
  }
}