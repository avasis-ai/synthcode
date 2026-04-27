import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface NodeData {
  id: string;
  name: string;
  duration: number;
  requiredResources: Record<string, number>;
}

export interface TemporalDependencyEdge {
  sourceId: string;
  targetId: string;
  timeWindowStart: number;
  timeWindowEnd: number;
  requiredResources: Record<string, number>;
}

export interface DependencyGraph {
  nodes: Record<string, NodeData>;
  edges: TemporalDependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV31 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private calculateCriticalPath(graph: DependencyGraph): Record<string, number> {
    const nodeDurations: Record<string, number> = {};
    const earliestFinishTime: Record<string, number> = {};
    const latestStartTime: Record<string, number> = {};
    const slack: Record<string, number> = {};

    for (const nodeId in graph.nodes) {
      const node = graph.nodes[nodeId];
      nodeDurations[nodeId] = node.duration;
      earliestFinishTime[nodeId] = 0;
      latestStartTime[nodeId] = Infinity;
      slack[nodeId] = Infinity;
    }

    // Simplified critical path calculation: assumes a single start point (time 0)
    // and calculates longest path based on accumulated durations.
    const sortedNodes: string[] = Object.keys(graph.nodes).sort((a, b) => {
      // Simple topological sort approximation if dependencies were fully defined,
      // but here we rely on iterative updates based on edge traversal.
      return 0;
    });

    const earliestStart: Record<string, number> = {};
    const earliestFinish: Record<string, number> = {};

    for (const nodeId of sortedNodes) {
      earliestStart[nodeId] = 0;
      earliestFinish[nodeId] = 0;
    }

    // Pass 1: Calculate Earliest Start/Finish (Forward Pass)
    let changed = true;
    let iteration = 0;
    const maxIterations = Object.keys(graph.nodes).length * 2;

    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;
      for (const edge of graph.edges) {
        const sourceId = edge.sourceId;
        const targetId = edge.targetId;

        const newEST = Math.max(
          (earliestFinish[sourceId] || 0),
          edge.timeWindowStart
        );

        if (newEST > earliestStart[targetId]) {
          earliestStart[targetId] = newEST;
          earliestFinish[targetId] = newEST + graph.nodes[targetId]!.duration;
          changed = true;
        }
      }
    }

    // For simplicity in this context, we return the accumulated earliest finish time as a proxy for critical path length.
    const criticalPathLength: Record<string, number> = {};
    for (const nodeId in graph.nodes) {
      criticalPathLength[nodeId] = earliestFinish[nodeId] || graph.nodes[nodeId]!.duration;
    }

    return criticalPathLength;
  }

  public visualize(
    messageHistory: Message[],
  ): {
    graph: DependencyGraph;
    criticalPath: Record<string, number>;
    visualizationData: {
      nodes: Record<string, {
        element: string;
        style: string;
      }>;
      edges: {
        element: string;
        style: string;
      }[];
    };
  } {
    const criticalPath = this.calculateCriticalPath(this.graph);

    const nodeVisualizationData: Record<string, {
      element: string;
      style: string;
    }> = {};

    for (const nodeId in this.graph.nodes) {
      const node = this.graph.nodes[nodeId];
      const pathLength = criticalPath[nodeId] || 0;
      const style = `background-color: ${
        pathLength > 0 ? 'rgba(255, 165, 0, 0.7)' : 'rgba(100, 100, 255, 0.5)'
      }; border-left: 5px solid ${
        pathLength > 0 ? 'orange' : 'blue'
      '};`;
      nodeVisualizationData[nodeId] = {
        element: `Node(${node.id})`,
        style: style,
      };
    }

    const edgeVisualizationData: {
      element: string;
      style: string;
    }[] = this.graph.edges.map((edge) => {
      const pathLength = criticalPath[edge.targetId] || 0;
      const style = `border-color: ${
        pathLength > 0 ? 'red' : 'gray'
      '}; opacity: ${
        (edge.timeWindowEnd - edge.timeWindowStart) / 1000 > 0 ? '1.0' : '0.5'
      }`;
      return {
        element: `Edge(${edge.sourceId} -> ${edge.targetId})`,
        style: style,
      };
    });

    return {
      graph: this.graph,
      criticalPath: criticalPath,
      visualizationData: {
        nodes: nodeVisualizationData,
        edges: edgeVisualizationData,
      },
    };
  }
}