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
  resourceName: string;
  minAmount: number;
  maxAmount: number;
}

export interface TimeWindow {
  startTimeMs: number;
  endTimeMs: number;
}

export interface TemporalEdge {
  sourceId: string;
  targetId: string;
  dependencies: string[];
  timeWindow: TimeWindow;
  requiredResources: ResourceConstraint[];
}

export interface GraphNode {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: TemporalEdge[];
}

type Path = {
  nodeId: string;
  edge: TemporalEdge;
  arrivalTimeMs: number;
  departureTimeMs: number;
};

interface PathResult {
  path: Path[];
  totalDurationMs: number;
  isFeasible: boolean;
}

export class DependencyGraphVisualizerV6 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private checkResourceFeasibility(path: Path[]): boolean {
    let currentResources: Record<string, number> = {};

    for (const step of path) {
      for (const constraint of step.edge.requiredResources) {
        const resourceName = constraint.resourceName;
        const requiredMin = constraint.minAmount;
        const requiredMax = constraint.maxAmount;

        const currentUsage = currentResources[resourceName] || 0;

        if (currentUsage + requiredMin > requiredMax) {
          return false;
        }
        currentResources[resourceName] = currentUsage + requiredMin;
      }
    }
    return true;
  }

  private findFeasiblePath(startNodeId: string, endNodeId: string): PathResult {
    const queue: {
      path: Path[];
      arrivalTimeMs: number;
    }[] = [{ path: [], arrivalTimeMs: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { path, arrivalTimeMs } = queue.shift()!;

      if (path.length > 0 && path[path.length - 1].nodeId === endNodeId) {
        if (this.checkResourceFeasibility(path)) {
          return {
            path: path,
            totalDurationMs: path[path.length - 1].departureTimeMs - path[0].arrivalTimeMs,
            isFeasible: true,
          };
        }
        continue;
      }

      const currentNodeId = path.length > 0 ? path[path.length - 1].nodeId : startNodeId;

      for (const edge of this.graph.edges) {
        if (edge.sourceId === currentNodeId && edge.targetId !== startNodeId) {
          const nextNodeId = edge.targetId;
          if (!visited.has(nextNodeId) && nextNodeId !== startNodeId) {
            const nextPath: Path[] = [...path, {
              nodeId: nextNodeId,
              edge: edge,
              arrivalTimeMs: Math.max(arrivalTimeMs, edge.timeWindow.startTimeMs),
              departureTimeMs: Math.min(Math.max(arrivalTimeMs, edge.timeWindow.startTimeMs) + 1000, edge.timeWindow.endTimeMs),
            }];

            const newArrivalTimeMs = Math.max(arrivalTimeMs, edge.timeWindow.startTimeMs);

            queue.push({
              path: [...path, {
                nodeId: nextNodeId,
                edge: edge,
                arrivalTimeMs: newArrivalTimeMs,
                departureTimeMs: Math.min(Math.max(newArrivalTimeMs, edge.timeWindow.startTimeMs) + 1000, edge.timeWindow.endTimeMs),
              }],
              arrivalTimeMs: newArrivalTimeMs,
            });
            visited.add(nextNodeId);
          }
        }
      }
    }

    return { path: [], totalDurationMs: 0, isFeasible: false };
  }

  public visualize(startId: string, endId: string): {
    pathResult: PathResult;
    visualHints: {
      edgeId: string;
      color: string;
      marker: string;
    }[];
  } {
    const pathResult = this.findFeasiblePath(startId, endId);

    const visualHints: {
      edgeId: string;
      color: string;
      marker: string;
    }[] = [];

    if (pathResult.isFeasible) {
      for (const step of pathResult.path) {
        const edge = step.edge;
        let color = "rgba(75, 192, 192, 0.8)";
        let marker = "•";

        if (!pathResult.isFeasible) {
          color = "rgba(255, 99, 132, 0.8)";
          marker = "X";
        } else if (edge.requiredResources.length > 0) {
          color = "rgba(255, 159, 64, 0.8)";
          marker = "R";
        } else if (edge.timeWindow.endTimeMs - edge.timeWindow.startTimeMs < 5000) {
          color = "rgba(255, 205, 86, 0.8)";
          marker = "T";
        }
        visualHints.push({
          edgeId: `${edge.sourceId}->${edge.targetId}`,
          color: color,
          marker: marker,
        });
      }
    }

    return {
      pathResult: pathResult,
      visualHints: visualHints,
    };
  }
}