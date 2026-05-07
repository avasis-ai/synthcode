export type NodeId = string | number;
export type EdgeWeight = number;

export interface Edge {
  target: NodeId;
  weight: EdgeWeight;
}

export type Graph = Map<NodeId, Edge[]>;

export class GraphPathfinder {
  constructor(private graph: Graph) {}

  /**
   * Finds the shortest path between two nodes using Breadth-First Search (BFS)
   * or Dijkstra's algorithm if weights are involved. Since the requirement
   * specifies BFS for shortest path, we assume unweighted or uniform weights
   * for simplicity, but we will adapt it to handle weights using a priority queue
   * approach (Dijkstra's).
   * @param start The starting node ID.
   * @param end The target node ID.
   * @returns An array of NodeIds representing the shortest path, or null if no path exists.
   */
  public findShortestPath(start: NodeId, end: NodeId): (NodeId | null)[] | null {
    if (!this.graph.has(start) || !this.graph.has(end)) {
      return null;
    }

    const distances = new Map<NodeId, number>();
    const previousNodes = new Map<NodeId, NodeId>();
    const unvisited = new Set<NodeId>();

    for (const nodeId of this.graph.keys()) {
      distances.set(nodeId, Infinity);
      previousNodes.set(nodeId, null);
      unvisited.add(nodeId);
    }

    distances.set(start, 0);

    // Simple Priority Queue implementation using an array and sorting (simulating Min-Heap)
    const pq: { id: NodeId; dist: number }[] = [{ id: start, dist: 0 }];

    while (pq.length > 0) {
      // Sort to simulate extracting the minimum distance node
      pq.sort((a, b) => a.dist - b.dist);
      const current = pq.shift()!;
      const currentNodeId = current.id;
      const currentDist = current.dist;

      if (currentNodeId === end) {
        break;
      }

      if (currentDist > distances.get(currentNodeId)!) {
        continue;
      }

      const neighbors = this.graph.get(currentNodeId) || [];

      for (const edge of neighbors) {
        const neighborId = edge.target;
        const weight = edge.weight;
        const newDist = currentDist + weight;

        if (newDist < distances.get(neighborId)!) {
          distances.set(neighborId, newDist);
          previousNodes.set(neighborId, currentNodeId);
          pq.push({ id: neighborId, dist: newDist });
        }
      }
    }

    // Reconstruct path
    const path: (NodeId | null)[] = [];
    let current: NodeId | null = end;

    while (current !== null) {
      path.unshift(current);
      if (current === start) break;
      current = previousNodes.get(current) as NodeId | null;
    }

    if (path[0] !== start || path[path.length - 1] !== end) {
      return null;
    }

    return path;
  }

  /**
   * Finds all possible simple paths (no repeated nodes) between start and end.
   * @param start The starting node ID.
   * @param end The target node ID.
   * @returns An array of paths, where each path is an array of NodeIds.
   */
  public findAllPaths(start: NodeId, end: NodeId): (NodeId | null)[][] {
    const allPaths: (NodeId | null)[][] = [];
    const visited = new Set<NodeId>();

    const dfs = (currentNode: NodeId, currentPath: (NodeId | null)[]): void => {
      currentPath.push(currentNode);
      visited.add(currentNode);

      if (currentNode === end) {
        allPaths.push([...currentPath]);
      } else {
        const neighbors = this.graph.get(currentNode) || [];
        for (const edge of neighbors) {
          const neighborId = edge.target;
          if (!visited.has(neighborId)) {
            dfs(neighborId, currentPath);
          }
        }
      }

      // Backtrack
      visited.delete(currentNode);
      currentPath.pop();
    };

    dfs(start, []);
    return allPaths;
  }
}<unused56>