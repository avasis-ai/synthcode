import { DependencyGraph } from "./dependency-graph.js";

export class DependencyGraphMerger {
  private graphs: DependencyGraph[];

  constructor(graphs: DependencyGraph[]) {
    this.graphs = graphs;
  }

  public merge(): DependencyGraph {
    const mergedNodes = new Map<string, { node: any; data: Map<string, any> }>();
    const mergedEdges = new Map<string, { target: string; weight: number; sources: Set<string> }>();

    for (const graph of this.graphs) {
      this.mergeGraph(graph, mergedNodes, mergedEdges);
    }

    const finalNodes: any[] = Array.from(mergedNodes.values()).map(item => item.node);
    const finalEdges: any[] = Array.from(mergedEdges.values()).map(item => ({
      source: item.source,
      target: item.target,
      weight: item.weight,
      sources: Array.from(item.sources),
    }));

    return new DependencyGraph(finalNodes, finalEdges);
  }

  private mergeGraph(graph: DependencyGraph, mergedNodes: Map<string, { node: any; data: Map<string, any> }>, mergedEdges: Map<string, { target: string; weight: number; sources: Set<string> }>) {
    for (const node of graph.nodes) {
      const nodeId = node.id;
      if (!mergedNodes.has(nodeId)) {
        mergedNodes.set(nodeId, { node: node, data: new Map<string, any>() });
      }
      const existing = mergedNodes.get(nodeId)!;
      this.aggregateNodeData(existing.data, node);
    }

    for (const edge of graph.edges) {
      const sourceId = edge.source;
      const targetId = edge.target;

      if (!mergedEdges.has(`${sourceId}->${targetId}`)) {
        mergedEdges.set(`${sourceId}->${targetId}`, {
          target: targetId,
          weight: edge.weight,
          sources: new Set<string>(),
        });
      }
      const edgeEntry = mergedEdges.get(`${sourceId}->${targetId}`)!;
      this.aggregateEdgeData(edgeEntry, edge);
    }
  }

  private aggregateNodeData(dataMap: Map<string, any>, node: any): void {
    if (node.properties) {
      Object.entries(node.properties).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (value instanceof Map) {
            value.forEach((v, k) => dataMap.set(k, v));
          } else {
            dataMap.set(key, value);
          }
        } else {
          dataMap.set(key, value);
        }
      });
    }
  }

  private aggregateEdgeData(edgeEntry: { target: string; weight: number; sources: Set<string> }, edge: any): void {
    // Conflict resolution strategy: Take the maximum weight, and union sources
    edgeEntry.weight = Math.max(edgeEntry.weight, edge.weight);
    edgeEntry.sources.add(edge.source);
  }
}