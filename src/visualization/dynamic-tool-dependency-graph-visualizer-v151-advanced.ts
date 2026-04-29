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

interface ResourceConstraint {
  resource: string;
  constraint: string;
  startTime?: number;
  endTime?: number;
}

interface ToolNode {
  id: string;
  name: string;
  dependencies: string[];
  resourceConstraints?: ResourceConstraint[];
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  resourceConflict?: {
    resource: string;
    overlapStart: number;
    overlapEnd: number;
  };
}

interface DependencyGraph {
  nodes: ToolNode[];
  edges: GraphEdge[];
}

interface VisualizationPayload {
  messages: Message[];
  graph: DependencyGraph;
  resourceConstraints: ResourceConstraint[];
}

export class DynamicToolDependencyGraphVisualizer {
  private payload: VisualizationPayload;

  constructor(payload: VisualizationPayload) {
    this.payload = payload;
  }

  private detectTemporalConflicts(graph: DependencyGraph, constraints: ResourceConstraint[]): GraphEdge[] {
    const conflicts: GraphEdge[] = [];
    const resourceTimeline: Record<string, { [key: number]: { start: number; end: number; source: string } }> = {};

    for (const constraint of constraints) {
      if (!constraint.startTime || !constraint.endTime) continue;

      for (const resourceName of [constraint.resource]) {
        if (!resourceTimeline[resourceName]) {
          resourceTimeline[resourceName] = {};
        }
      }
    }

    for (const constraint of constraints) {
      const { resource, startTime, endTime } = constraint;

      if (!resourceTimeline[resource]) continue;

      for (const existingConstraint of constraints) {
        if (constraint === existingConstraint) continue;

        const { startTime: otherStart, endTime: otherEnd } = existingConstraint;

        if (resource === existingConstraint.resource && otherStart && otherEnd) {
          const overlapStart = Math.max(startTime, otherStart);
          const overlapEnd = Math.min(endTime, otherEnd);

          if (overlapStart < overlapEnd) {
            const conflictEdge: GraphEdge = {
              source: `ResourceConflict(${resource})`,
              target: `ResourceConflict(${resource})`,
              weight: 1,
              resourceConflict: {
                resource: resource,
                overlapStart: overlapStart,
                overlapEnd: overlapEnd,
              },
            };
            conflicts.push(conflictEdge);
          }
        }
      }
    }
    return conflicts;
  }

  private processGraphForVisualization(graph: DependencyGraph, constraints: ResourceConstraint[]): DependencyGraph {
    const updatedNodes: ToolNode[] = graph.nodes.map(node => {
      const nodeWithConstraints: ToolNode = { ...node };
      if (node.resourceConstraints && node.resourceConstraints.length > 0) {
        nodeWithConstraints.resourceConstraints = node.resourceConstraints;
      }
      return nodeWithConstraints;
    });

    const updatedEdges: GraphEdge[] = graph.edges.map(edge => {
      let conflictEdge: GraphEdge | undefined = undefined;

      // Simplified conflict detection: Check if any two connected nodes share a resource conflict
      // In a real scenario, this would involve complex temporal intersection logic per edge.
      // Here, we simulate by checking if the edge's source/target nodes have overlapping constraints.
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const commonResources: string[] = [];
        const allConstraints: ResourceConstraint[] = [
          ...(sourceNode.resourceConstraints || []),
          ...(targetNode.resourceConstraints || []),
        ];

        // Placeholder for actual conflict detection logic based on edge context
        // For simplicity, we rely on the dedicated conflict detection pass below.
      }

      return { ...edge };
    });

    return { nodes: updatedNodes, edges: updatedEdges };
  }

  public visualize(): { nodes: any[]; edges: any[]; conflicts: any[] } {
    const { graph, resourceConstraints } = this.payload;

    const processedGraph = this.processGraphForVisualization(graph, resourceConstraints);
    const conflictEdges = this.detectTemporalConflicts(graph, resourceConstraints);

    return {
      nodes: processedGraph.nodes,
      edges: processedGraph.edges,
      conflicts: conflictEdges,
    };
  }
}