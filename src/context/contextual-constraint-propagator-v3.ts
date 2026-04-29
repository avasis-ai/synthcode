import { GraphContext, Constraint, GraphConstraint, GraphConstraintSet } from "./types";

export class ContextualConstraintPropagatorV3 {
  private graphContext: GraphContext;
  private initialConstraints: Set<Constraint>;

  constructor(graphContext: GraphContext, initialConstraints: Set<Constraint>) {
    this.graphContext = graphContext;
    this.initialConstraints = initialConstraints;
  }

  private traverseGraph(startNodeId: string): Set<GraphConstraint> {
    const visitedNodes = new Set<string>();
    const queue: { nodeId: string, path: { nodeId: string, edgeId: string }[] }[] = [{ nodeId: startNodeId, path: [] }];
    const discoveredConstraints: Set<GraphConstraint> = new Set();

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      if (visitedNodes.has(nodeId)) continue;
      visitedNodes.add(nodeId);

      const currentNode = this.graphContext.nodes.get(nodeId);
      if (!currentNode) continue;

      // 1. Check constraints at the node itself (if applicable)
      const nodeConstraints = this.graphContext.getConstraintsForNode(nodeId);
      for (const constraint of nodeConstraints) {
        const graphConstraint: GraphConstraint = {
          constraint: constraint,
          sourceNodeId: nodeId,
          targetEdgeId: null,
          path: [...path],
        };
        discoveredConstraints.add(graphConstraint);
      }

      // 2. Explore neighbors (edges)
      const neighbors = this.graphContext.getNeighbors(nodeId);
      for (const edge of neighbors) {
        const neighborId = edge.targetNodeId;
        const newPath = [...path, { nodeId: nodeId, edgeId: edge.edgeId }];

        // Check constraints associated with the edge traversal
        const edgeConstraints = this.graphContext.getConstraintsForEdge(edge.edgeId);
        for (const constraint of edgeConstraints) {
          const graphConstraint: GraphConstraint = {
            constraint: constraint,
            sourceNodeId: nodeId,
            targetEdgeId: edge.edgeId,
            path: newPath,
          };
          discoveredConstraints.add(graphConstraint);
        }

        // Add neighbor to queue if not visited
        if (!visitedNodes.has(neighborId)) {
          queue.push({ nodeId: neighborId, path: newPath });
        }
      }
    }
    return discoveredConstraints;
  }

  public propagateConstraints(startNodeId: string): GraphConstraintSet {
    const discoveredGraphConstraints = this.traverseGraph(startNodeId);

    const combinedConstraints: Set<Constraint> = new Set(this.initialConstraints);

    for (const graphConstraint of discoveredGraphConstraints) {
      combinedConstraints.add(graphConstraint.constraint);
    }

    return {
      allConstraints: combinedConstraints,
      graphSpecificConstraints: discoveredGraphConstraints,
    };
  }
}