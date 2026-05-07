export type CausalityType = "REQUIRES" | "PRECEDES" | "CAUSES";

export interface CausalLink {
  sourceId: string;
  targetId: string;
  causality: CausalityType;
  payload?: Record<string, unknown>;
}

export type GraphNode = {
  id: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  // Add any other relevant metadata if needed, e.g., type: "tool" | "step"
};

export class CausalDependencyGraphBuilder {
  private nodes: Map<string, GraphNode>;
  private links: CausalLink[];

  constructor() {
    this.nodes = new Map();
    this.links = [];
  }

  addLink(link: CausalLink): this {
    this.links.push(link);
    return this;
  }

  build(): Map<string, GraphNode> {
    this.nodes.clear();
    this.links.forEach(link => {
      if (!this.nodes.has(link.sourceId)) {
        this.nodes.set(link.sourceId, { id: link.sourceId, dependencies: new Set(), dependents: new Set() });
      }
      if (!this.nodes.has(link.targetId)) {
        this.nodes.set(link.targetId, { id: link.targetId, dependencies: new Set(), dependents: new Set() });
      }

      const sourceNode = this.nodes.get(link.sourceId)!;
      const targetNode = this.nodes.get(link.targetId)!;

      // Assuming 'CAUSES' means Source -> Target (Source must happen before Target)
      // We model this as a directed edge: Source must complete before Target can start.
      sourceNode.dependents.add(link.targetId);
      targetNode.dependencies.add(link.sourceId);
    });

    return this.nodes;
  }
}

export class CausalDependencyResolver {
  private graph: Map<string, GraphNode>;

  constructor(graph: Map<string, GraphNode>) {
    this.graph = graph;
  }

  /**
   * Performs a topological sort to determine the minimum required execution sequence.
   * @returns An array of node IDs in the correct causal execution order.
   * @throws Error if a cycle is detected.
   */
  resolveSequence(): string[] {
    const inDegree: Map<string, number> = new Map();
    const queue: string[] = [];
    const sortedOrder: string[] = [];
    const visited: Set<string> = new Set();

    // 1. Initialize in-degrees and queue with all nodes having 0 dependencies
    this.graph.forEach((node, id) => {
      inDegree.set(id, node.dependencies.size);
      if (node.dependencies.size === 0) {
        queue.push(id);
      }
    });

    // 2. Kahn's Algorithm (Topological Sort)
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sortedOrder.push(nodeId);
      visited.add(nodeId);

      const node = this.graph.get(nodeId)!;

      for (const dependentId of node.dependents) {
        const currentInDegree = inDegree.get(dependentId)! - 1;
        inDegree.set(dependentId, currentInDegree);

        if (currentInDegree === 0) {
          queue.push(dependentId);
        }
      }
    }

    // 3. Cycle Detection
    if (sortedOrder.length !== this.graph.size) {
      throw new Error("Causal dependency cycle detected. Cannot determine a linear execution sequence.");
    }

    return sortedOrder;
  }
}

export { CausalDependencyGraphBuilder, CausalDependencyResolver };