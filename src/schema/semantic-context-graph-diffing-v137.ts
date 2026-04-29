import { Graph, Node, Edge } from "./graph-types";

export type SemanticDiffReport = {
  addedNodes: Node[];
  deletedNodes: Node[];
  modifiedNodes: { node: Node; old: Node; changes: Record<string, any> }[];
  addedEdges: Edge[];
  deletedEdges: Edge[];
  modifiedEdges: { edge: Edge; old: Edge; changes: Record<string, any> }[];
  conceptualGaps: string[];
  summary: {
    nodeCountDelta: number;
    edgeCountDelta: number;
    driftDetected: boolean;
  };
};

export class SemanticContextGraphDiffer {
  private graphA: Graph;
  private graphB: Graph;

  constructor(graphA: Graph, graphB: Graph) {
    this.graphA = graphA;
    this.graphB = graphB;
  }

  public calculateDiffReport(): SemanticDiffReport {
    const nodeDiff = this.diffNodes();
    const edgeDiff = this.diffEdges();
    const conceptualGaps = this.detectConceptualGaps();

    const summary = {
      nodeCountDelta: nodeDiff.addedNodes.length + nodeDiff.modifiedNodes.length - nodeDiff.deletedNodes.length,
      edgeCountDelta: edgeDiff.addedEdges.length + edgeDiff.modifiedEdges.length - edgeDiff.deletedEdges.length,
      driftDetected: nodeDiff.modifiedNodes.length > 0 || edgeDiff.modifiedEdges.length > 0,
    };

    return {
      addedNodes: nodeDiff.addedNodes,
      deletedNodes: nodeDiff.deletedNodes,
      modifiedNodes: nodeDiff.modifiedNodes,
      addedEdges: edgeDiff.addedEdges,
      deletedEdges: edgeDiff.deletedEdges,
      modifiedEdges: edgeDiff.modifiedEdges,
      conceptualGaps: conceptualGaps,
      summary: summary,
    };
  }

  private diffNodes(): {
    addedNodes: Node[];
    deletedNodes: Node[];
    modifiedNodes: { node: Node; old: Node; changes: Record<string, any> }[];
  } {
    const nodesA = new Map<string, Node>();
    this.graphA.nodes.forEach(node => nodesA.set(node.id, node));

    const nodesB = new Map<string, Node>();
    this.graphB.nodes.forEach(node => nodesB.set(node.id, node));

    const addedNodes: Node[] = [];
    const deletedNodes: Node[] = [];
    const modifiedNodes: { node: Node; old: Node; changes: Record<string, any> }[] = [];

    // Check for additions and modifications (A -> B)
    for (const [id, nodeB] of nodesB.entries()) {
      const nodeA = nodesA.get(id);
      if (!nodeA) {
        addedNodes.push(nodeB);
        continue;
      }

      const changes: Record<string, any> = this.calculateNodeChanges(nodeA, nodeB);
      if (Object.keys(changes).length > 0) {
        modifiedNodes.push({ node: nodeB, old: nodeA, changes });
      }
    }

    // Check for deletions (A exists, B does not)
    for (const [id, nodeA] of nodesA.entries()) {
      if (!nodesB.has(id)) {
        deletedNodes.push(nodeA);
      }
    }

    return { addedNodes, deletedNodes, modifiedNodes };
  }

  private diffEdges(): {
    addedEdges: Edge[];
    deletedEdges: Edge[];
    modifiedEdges: { edge: Edge; old: Edge; changes: Record<string, any> }[];
  } {
    const edgesA = new Map<string, Edge>();
    this.graphA.edges.forEach(edge => edgesA.set(`${edge.source}-${edge.target}-${edge.type}`, edge));

    const edgesB = new Map<string, Edge>();
    this.graphB.edges.forEach(edge => edgesB.set(`${edge.source}-${edge.target}-${edge.type}`, edge));

    const addedEdges: Edge[] = [];
    const deletedEdges: Edge[] = [];
    const modifiedEdges: { edge: Edge; old: Edge; changes: Record<string, any> }[] = [];

    // Check for additions and modifications (A -> B)
    for (const [key, edgeB] of edgesB.entries()) {
      const edgeA = edgesA.get(key);
      if (!edgeA) {
        addedEdges.push(edgeB);
        continue;
      }

      const changes: Record<string, any> = this.calculateEdgeChanges(edgeA, edgeB);
      if (Object.keys(changes).length > 0) {
        modifiedEdges.push({ edge: edgeB, old: edgeA, changes });
      }
    }

    // Check for deletions (A exists, B does not)
    for (const [key, edgeA] of edgesA.entries()) {
      if (!edgesB.has(key)) {
        deletedEdges.push(edgeA);
      }
    }

    return { addedEdges, deletedEdges, modifiedEdges };
  }

  private calculateNodeChanges(oldNode: Node, newNode: Node): Record<string, any> {
    const changes: Record<string, any> = {};
    if (oldNode.metadata !== newNode.metadata) {
      changes["metadata"] = { old: oldNode.metadata, new: newNode.metadata };
    }
    if (oldNode.properties !== newNode.properties) {
      changes["properties"] = { old: oldNode.properties, new: newNode.properties };
    }
    return changes;
  }

  private calculateEdgeChanges(oldEdge: Edge, newEdge: Edge): Record<string, any> {
    const changes: Record<string, any> = {};
    if (oldEdge.metadata !== newEdge.metadata) {
      changes["metadata"] = { old: oldEdge.metadata, new: newEdge.metadata };
    }
    if (oldEdge.properties !== newEdge.properties) {
      changes["properties"] = { old: oldEdge.properties, new: newEdge.properties };
    }
    return changes;
  }

  private detectConceptualGaps(): string[] {
    const gaps: string[] = [];

    const nodesA = new Map<string, Node>();
    this.graphA.nodes.forEach(node => nodesA.set(node.id, node));

    const nodesB = new Map<string, Node>();
    this.graphB.nodes.forEach(node => nodesB.set(node.id, node));

    // Simple gap detection: Check for nodes present in A but lacking connections in B, or vice versa
    const nodeIdsA = new Set(this.graphA.nodes.map(n => n.id));
    const nodeIdsB = new Set(this.graphB.nodes.map(n => n.id));

    const commonNodes = new Set([...nodeIdsA].filter(id => nodeIdsB.has(id)));

    for (const nodeId of commonNodes) {
      const nodeA = nodesA.get(nodeId)!;
      const nodeB = nodesB.get(nodeId)!;

      const edgesInA = new Set<string>();
      this.graphA.edges.filter(e => e.source === nodeId).forEach(e => edgesInA.add(e.target));
      const edgesInB = new Set<string>();
      this.graphB.edges.filter(e => e.source === nodeId).forEach(e => edgesInB.add(e.target));

      const missingTargets = [...new Set([...nodeIdsA].filter(id => id !== nodeId) || [...nodeIdsB].filter(id => id !== nodeId))].filter(targetId => {
        const hasTargetInA = edgesInA.has(targetId);
        const hasTargetInB = edgesInB.has(targetId);
        return !(hasTargetInA && hasTargetInB);
      });

      if (missingTargets.length > 0) {
        gaps.push(`Node ${nodeId} has potential connectivity gaps. Targets present in A but not B, or vice versa: ${missingTargets.join(', ')}`);
      }
    }

    return gaps;
  }
}