import { GraphPayload, Node, Edge, Triple } from "./graph-types";

interface SemanticDiffReport {
  addedNodes: Node[];
  deletedNodes: Node[];
  modifiedNodes: { old: Node; new: Node; changes: string }[];
  addedEdges: Edge[];
  deletedEdges: Edge[];
  modifiedEdges: { old: Edge; new: Edge; changes: string }[];
  semanticDriftScore: number;
  summary: string;
}

type GraphPayload = {
  nodes: Node[];
  edges: Edge[];
  triples: Triple[];
};

export class SemanticContextGraphDiffer {
  private graphA: GraphPayload;
  private graphB: GraphPayload;

  constructor(graphA: GraphPayload, graphB: GraphPayload) {
    this.graphA = graphA;
    this.graphB = graphB;
  }

  private calculateSemanticSimilarity(entityA: any, entityB: any): number {
    const nodeSimilarity = (nodeA: Node, nodeB: Node): number => {
      if (nodeA.id !== nodeB.id) return 0;
      let score = 0;
      if (nodeA.properties.text && nodeB.properties.text) {
        const textA = nodeA.properties.text.toLowerCase();
        const textB = nodeB.properties.text.toLowerCase();
        const commonWords = new Set([...textA.split(/\s+/).filter(Boolean)).filter(word => textB.toLowerCase().includes(word));
        score += commonWords.size * 0.1;
      }
      return Math.min(1.0, score / 5);
    };

    const edgeSimilarity = (edgeA: Edge, edgeB: Edge): number => {
      if (edgeA.sourceId !== edgeB.sourceId || edgeA.targetId !== edgeB.targetId) return 0;
      let score = 0;
      if (edgeA.properties.label && edgeB.properties.label) {
        const labelA = edgeA.properties.label.toLowerCase();
        const labelB = edgeB.properties.label.toLowerCase();
        if (labelA === labelB) score += 0.5;
      }
      return Math.min(1.0, score / 1.5);
    };

    // Simplified semantic scoring based on node/edge comparison
    let totalScore = 0;
    let count = 0;

    // Node comparison (only comparing nodes with same IDs)
    const nodesA = new Map(entityA.nodes.map(n => [n.id, n]));
    const nodesB = new Map(entityB.nodes.map(n => [n.id, n]));

    for (const [id, nodeA] of nodesA.entries()) {
      const nodeB = nodesB.get(id);
      if (nodeB) {
        totalScore += nodeSimilarity(nodeA, nodeB);
        count++;
      }
    }

    // Edge comparison (only comparing edges with same source/target)
    const edgesA = new Map(entityA.edges.map(e => [`${e.sourceId}-${e.targetId}`, e]));
    const edgesB = new Map(entityB.edges.map(e => [`${e.sourceId}-${e.targetId}`, e]));

    for (const [key, edgeA] of edgesA.entries()) {
      const edgeB = edgesB.get(key);
      if (edgeB) {
        totalScore += edgeSimilarity(edgeA, edgeB);
        count++;
      }
    }

    return count > 0 ? Math.min(1.0, totalScore / Math.max(1, count)) : 0.0;
  }

  private compareNodes(nodesA: Node[], nodesB: Node[]): { added: Node[]; deleted: Node[]; modified: { old: Node; new: Node; changes: string }[] } {
    const mapA = new Map<string, Node>(nodesA.map(n => [n.id, n]));
    const mapB = new Map<string, Node>(nodesB.map(n => [n.id, n]));

    const added: Node[] = [];
    const deleted: Node[] = [];
    const modified: { old: Node; new: Node; changes: string }[] = [];

    // Check for additions and modifications
    for (const [id, nodeB] of mapB.entries()) {
      const nodeA = mapA.get(id);
      if (!nodeA) {
        added.push(nodeB);
      } else {
        let changes = "";
        let isModified = false;
        const propsA = nodeA.properties;
        const propsB = nodeB.properties;

        if (JSON.stringify(propsA) !== JSON.stringify(propsB)) {
          changes = `Properties changed: ${JSON.stringify(propsA)} -> ${JSON.stringify(propsB)}`;
          isModified = true;
        }

        if (isModified) {
          modified.push({ old: nodeA, new: nodeB, changes });
        }
      }
    }

    // Check for deletions
    for (const [id, nodeA] of mapA.entries()) {
      if (!mapB.has(id)) {
        deleted.push(nodeA);
      }
    }

    return { added, deleted, modified };
  }

  private compareEdges(edgesA: Edge[], edgesB: Edge[]): { added: Edge[]; deleted: Edge[]; modified: { old: Edge; new: Edge; changes: string }[] } {
    const keyA = (e: Edge) => `${e.sourceId}-${e.targetId}-${e.label}`;
    const keyB = (e: Edge) => `${e.sourceId}-${e.targetId}-${e.label}`;

    const mapA = new Map<string, Edge>(edgesA.map(e => [keyA(e), e]));
    const mapB = new Map<string, Edge>(edgesB.map(e => [keyB(e), e]));

    const added: Edge[] = [];
    const deleted: Edge[] = [];
    const modified: { old: Edge; new: Edge; changes: string }[] = [];

    // Check for additions and modifications
    for (const [key, edgeB] of mapB.entries()) {
      const edgeA = mapA.get(key);
      if (!edgeA) {
        added.push(edgeB);
      } else {
        let changes = "";
        let isModified = false;
        const propsA = edgeA.properties;
        const propsB = edgeB.properties;

        if (JSON.stringify(propsA) !== JSON.stringify(propsB)) {
          changes = `Properties changed: ${JSON.stringify(propsA)} -> ${JSON.stringify(propsB)}`;
          isModified = true;
        }

        if (isModified) {
          modified.push({ old: edgeA, new: edgeB, changes });
        }
      }
    }

    // Check for deletions
    for (const [key, edgeA] of mapA.entries()) {
      if (!mapB.has(key)) {
        deleted.push(edgeA);
      }
    }

    return { added, deleted, modified };
  }

  public diff(graphA: GraphPayload, graphB: GraphPayload): SemanticDiffReport {
    const nodeDiff = this.compareNodes(graphA.nodes, graphB.nodes);
    const edgeDiff = this.compareEdges(graphA.edges, graphB.edges);

    const semanticDriftScore = this.calculateSemanticSimilarity(
      { nodes: graphA.nodes, edges: graphA.edges },
      { nodes: graphB.nodes, edges: graphB.edges }
    );

    const summary = `Graph comparison complete. Nodes: ${nodeDiff.added.length} added, ${nodeDiff.deleted.length} deleted, ${nodeDiff.modified.length} modified. Edges: ${edgeDiff.added.length} added, ${edgeDiff.deleted.length} deleted, ${edgeDiff.modified.length} modified. Semantic Drift Score: ${semanticDriftScore.toFixed(3)}`;

    return {
      addedNodes: nodeDiff.added,
      deletedNodes: nodeDiff.deleted,
      modifiedNodes: nodeDiff.modified,
      addedEdges: edgeDiff.added,
      deletedEdges: edgeDiff.deleted,
      modifiedEdges: edgeDiff.modified,
      semanticDriftScore: semanticDriftScore,
      summary: summary,
    };
  }
}