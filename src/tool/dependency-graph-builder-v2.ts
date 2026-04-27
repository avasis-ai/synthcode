import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface DependencyEdge {
  source: string;
  target: string;
  weight: number;
  dependencyType: 'cost' | 'reliability';
}

export interface DependencyGraph {
  nodes: Set<string>;
  adjacencyList: Map<string, { target: string; weight: number; dependencyType: 'cost' | 'reliability'; }[]>;
  totalWeight: number;
}

export class DependencyGraphBuilderV2 {
  private nodes: Set<string> = new Set();
  private edges: DependencyEdge[] = [];

  constructor() {}

  public addNode(nodeId: string): this {
    this.nodes.add(nodeId);
    return this;
  }

  public addEdge(edge: DependencyEdge): this {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error(`Nodes ${edge.source} or ${edge.target} must be added before creating an edge.`);
    }
    this.edges.push(edge);
    return this;
  }

  public buildGraph(): DependencyGraph {
    const adjacencyList = new Map<string, { target: string; weight: number; dependencyType: 'cost' | 'reliability'; }[]>();
    for (const nodeId of this.nodes) {
      adjacencyList.set(nodeId, []);
    }

    let totalWeight = 0;

    for (const edge of this.edges) {
      const edgeData = {
        target: edge.target,
        weight: edge.weight,
        dependencyType: edge.dependencyType,
      };
      adjacencyList.get(edge.source)!.push(edgeData);
      totalWeight += edge.weight;
    }

    return {
      nodes: new Set(this.nodes),
      adjacencyList: adjacencyList,
      totalWeight: totalWeight,
    };
  }

  public findCriticalPath(graph: DependencyGraph, startNode: string, endNode: string): { path: string[]; weight: number } | null {
    if (!graph.nodes.has(startNode) || !graph.nodes.has(endNode)) {
      return null;
    }

    const distances = new Map<string, number>();
    const predecessors = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const nodeId of graph.nodes) {
      distances.set(nodeId, Infinity);
      predecessors.set(nodeId, null);
      unvisited.add(nodeId);
    }

    distances.set(startNode, 0);

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          current = nodeId;
        }
      }

      if (current === null || minDistance === Infinity) break;

      unvisited.delete(current);

      const neighbors = graph.adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newDist = distances.get(current)! + neighbor.weight;
        if (newDist < distances.get(neighbor.target)! && unvisited.has(neighbor.target)) {
          distances.set(neighbor.target, newDist);
          predecessors.set(neighbor.target, current);
        }
      }
    }

    if (distances.get(endNode) === Infinity) {
      return null;
    }

    const path: string[] = [];
    let currentNode: string | null = endNode;
    while (currentNode !== null) {
      path.unshift(currentNode);
      currentNode = predecessors.get(currentNode);
    }

    return {
      path: path,
      weight: distances.get(endNode)!
    };
  }
}