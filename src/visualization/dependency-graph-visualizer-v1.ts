import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface GraphNode {
  id: string;
  label: string;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  label?: string;
}

export type DependencyGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export class DependencyGraphVisualizerV1 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNeighbors(nodeId: string): GraphEdge[] {
    return this.graph.edges.filter(edge =>
      edge.fromId === nodeId
    );
  }

  private getIncomingEdges(nodeId: string): GraphEdge[] {
    return this.graph.edges.filter(edge =>
      edge.toId === nodeId
    );
  }

  private traverseAndOrder(startNodeId: string): string[] {
    const visited = new Set<string>();
    const traversalOrder: string[] = [];
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      traversalOrder.push(nodeId);

      const neighbors = this.getNeighbors(nodeId).map(edge => edge.toId);
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          queue.push(neighborId);
        }
      }
    }
    return traversalOrder;
  }

  private renderNode(node: GraphNode, index: number): string {
    const padding = Math.max(0, Math.floor((index % 3) / 2));
    const label = node.label.substring(0, Math.min(node.label.length, 15));
    return `[${String(index + 1).padStart(2, ' ')}] ${label.padEnd(15)} (${node.id})`;
  }

  private renderEdge(edge: GraphEdge, fromIndex: number, toIndex: number): string {
    const padding = Math.max(0, Math.floor((fromIndex % 3) / 2));
    const label = edge.label ? ` (${edge.label})` : "";
    return ` ${' '.repeat(padding)} ${'->'}${label}`;
  }

  public visualize(): string {
    if (!this.graph.nodes.length || !this.graph.edges.length) {
      return "Dependency Graph is empty.";
    }

    const orderedNodeIds = this.traverseAndOrder(this.graph.nodes[0].id);
    const nodeMap = new Map<string, GraphNode>();
    orderedNodeIds.forEach(id => {
      const node = this.graph.nodes.find(n => n.id === id);
      if (node) nodeMap.set(id, node);
    });

    const nodeLines: string[] = [];
    const edgeLines: string[] = [];

    // 1. Render Nodes
    orderedNodeIds.forEach((id, index) => {
      const node = nodeMap.get(id)!;
      nodeLines.push(this.renderNode(node, index));
    });

    // 2. Render Edges (Simplified: just list connections based on traversal order)
    const processedEdges = new Set<string>();
    this.graph.edges.forEach(edge => {
      const key = `${edge.fromId}->${edge.toId}`;
      if (!processedEdges.has(key)) {
        const fromNode = nodeMap.get(edge.fromId)!;
        const toNode = nodeMap.get(edge.toId)!;
        const fromIndex = orderedNodeIds.indexOf(edge.fromId);
        const toIndex = orderedNodeIds.indexOf(edge.toId);

        if (fromIndex !== -1 && toIndex !== -1) {
          edgeLines.push(this.renderEdge(edge, fromIndex, toIndex));
          processedEdges.add(key);
        }
      }
    });

    let output = "--- Dependency Graph Visualization ---\n";
    output += "Nodes (Traversal Order):\n";
    output += nodeLines.join("\n");
    output += "\nEdges (Flow):\n";
    output += edgeLines.join("\n");
    output += "\n------------------------------------";

    return output;
  }
}