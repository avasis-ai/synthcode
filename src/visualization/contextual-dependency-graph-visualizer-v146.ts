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
  resourceId: string;
  minLevel: number;
  maxLevel: number;
}

export interface TimeWindow {
  startTime: number;
  endTime: number;
}

export interface ContextualDependencyPayload {
  sourceId: string;
  targetId: string;
  dependencies: Array<{
    timeWindow: TimeWindow;
    resourceConstraints: ResourceConstraint[];
    description: string;
  }>;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "component" | "service" | "data";
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  contextualDependencies: ContextualDependencyPayload[];
}

export class ContextualDependencyGraphVisualizer {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();

  constructor() {}

  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  public addEdge(edge: GraphEdge): void {
    const key = `${edge.sourceId}->${edge.targetId}`;
    this.edges.set(key, edge);
  }

  public processPayload(payload: ContextualDependencyPayload): void {
    // In a real implementation, this would update/validate existing edges
    // For this structure, we assume the caller manages node addition.
    // We just ensure the edge structure is ready for rendering.
    console.log(`Processing contextual dependency for ${payload.sourceId} -> ${payload.targetId}`);
  }

  public getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  public visualize(): void {
    const nodes = this.getNodes();
    const edges = this.getEdges();

    console.log("--- Contextual Dependency Graph Visualization Data ---");
    console.log(`Nodes found: ${nodes.length}`);
    console.log(`Edges found: ${edges.length}`);

    edges.forEach((edge, index) => {
      console.log(`\nEdge ${index + 1}: ${edge.sourceId} -> ${edge.targetId}`);
      edge.contextualDependencies.forEach((dep, depIndex) => {
        console.log(`  Context ${depIndex + 1}: ${dep.description}`);
        console.log(`    Time: [${dep.timeWindow.startTime} - ${dep.timeWindow.endTime}]`);
        console.log(`    Resources: ${dep.resourceConstraints.map(r => `${r.resourceId}: ${r.minLevel}-${r.maxLevel}`).join(', ')}`);
      });
    });
  }
}