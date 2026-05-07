import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type NodeId = string;
type RelationshipType = string;

interface TemporalNode {
  id: NodeId;
  content: string;
  createdAt: number;
  expiresAt: number;
}

interface TemporalEdge {
  sourceId: NodeId;
  targetId: NodeId;
  type: RelationshipType;
  createdAt: number;
  expiresAt: number;
}

interface GraphData {
  nodes: Map<NodeId, TemporalNode>;
  edges: TemporalEdge[];
}

interface PathStep {
  nodeId: NodeId;
  edge: TemporalEdge;
  timestamp: number;
}

export interface FoundPath {
  steps: PathStep[];
  totalDuration: number;
}

export class TemporalKnowledgeGraphQueryEngine {
  private graph: GraphData;

  constructor(graph: GraphData) {
    this.graph = graph;
  }

  private isTimeValid(timestamp: number, startTime: number, endTime: number): boolean {
    return timestamp >= startTime && timestamp <= endTime;
  }

  private isNodeActive(node: TemporalNode, startTime: number, endTime: number): boolean {
    return node.createdAt <= endTime && node.expiresAt >= startTime;
  }

  private isEdgeActive(edge: TemporalEdge, startTime: number, endTime: number): boolean {
    return edge.createdAt <= endTime && edge.expiresAt >= startTime;
  }

  private findNeighbors(
    currentNodeId: NodeId,
    startTime: number,
    endTime: number,
  ): {
    neighborId: NodeId;
    edge: TemporalEdge;
  }[] {
    const validNeighbors: {
      neighborId: NodeId;
      edge: TemporalEdge;
    }[] = [];

    for (const edge of this.graph.edges) {
      if (edge.sourceId === currentNodeId) {
        if (this.isEdgeActive(edge, startTime, endTime)) {
          validNeighbors.push({
            neighborId: edge.targetId,
            edge: edge,
          });
        }
      }
    }
    return validNeighbors;
  }

  public query(
    startNodeId: NodeId,
    endNodeId?: NodeId,
    startTime: number,
    endTime: number,
  ): FoundPath[] {
    if (!this.graph.nodes.has(startNodeId)) {
      return [];
    }

    if (!this.isNodeActive(
      this.graph.nodes.get(startNodeId)!,
      startTime,
      endTime,
    )) {
      return [];
    }

    const foundPaths: FoundPath[] = [];
    const queue: {
      currentPath: PathStep[];
      currentNodeId: NodeId;
      depth: number;
    }[] = [{
      currentPath: [],
      currentNodeId: startNodeId,
      depth: 0,
    }];

    const maxDepth = 5;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const { currentPath, currentNodeId, depth } = current;

      if (depth >= maxDepth) continue;

      const neighbors = this.findNeighbors(currentNodeId, startTime, endTime);

      for (const { neighborId, edge } of neighbors) {
        const nextNode = this.graph.nodes.get(neighborId);

        if (!nextNode || !this.isNodeActive(nextNode, startTime, endTime)) {
          continue;
        }

        const newPathSteps: PathStep[] = [...currentPath, {
          nodeId: neighborId,
          edge: edge,
          timestamp: edge.createdAt,
        }];

        const newPath: FoundPath = {
          steps: newPathSteps,
          totalDuration: newPathSteps.length > 0 ? Math.max(
            ...newPathSteps.map(s => s.timestamp)
          ) - Math.min(
            ...newPathSteps.map(s => s.timestamp)
          ) : 0,
        };

        if (endNodeId && neighborId === endNodeId) {
          foundPaths.push(newPath);
          continue;
        }

        if (!endNodeId && depth > 0) {
          foundPaths.push(newPath);
        }

        queue.push({
          currentPath: newPathSteps,
          currentNodeId: neighborId,
          depth: depth + 1,
        });
      }
    }

    return foundPaths;
  }
}