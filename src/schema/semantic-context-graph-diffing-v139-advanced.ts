import { Graph, Node, Edge } from "./graph-types";

type SemanticSimilarity = number;

interface DiffReport {
  added: { nodeId: string; details: any }[];
  removed: { nodeId: string; details: any }[];
  modified: { nodeId: string; changes: { attribute: string; from: any; to: any }[]; confidence: number }[];
  semanticallyDrifted: { edgeId: string; reason: string; confidence: number }[];
}

interface GraphDiffingService {
  compareGraphs(graphA: Graph, graphB: Graph): DiffReport;
}

export class SemanticContextGraphDiffer {
  private readonly SIMILARITY_THRESHOLD: number = 0.85;

  compareGraphs(graphA: Graph, graphB: Graph): DiffReport {
    const report: DiffReport = {
      added: [],
      removed: [],
      modified: [],
      semanticallyDrifted: [],
    };

    const nodesA = new Map<string, Node>(graphA.nodes.map(n => [n.id, n]));
    const nodesB = new Map<string, Node>(graphB.nodes.map(n => [n.id, n]));

    // 1. Node Comparison
    const allNodeIds = new Set([...nodesA.keys(), ...nodesB.keys()]);
    for (const nodeId of allNodeIds) {
      const nodeA = nodesA.get(nodeId);
      const nodeB = nodesB.get(nodeId);

      if (!nodeA) {
        report.added.push({ nodeId, details: nodeB });
        continue;
      }
      if (!nodeB) {
        report.removed.push({ nodeId, details: nodeA });
        continue;
      }

      const similarity = this.calculateNodeSimilarity(nodeA, nodeB);
      if (similarity < 1.0 - 0.1) { // Check for significant change
        const attributeChanges = this.compareAttributes(nodeA, nodeB);
        if (attributeChanges.length > 0 || similarity < this.SIMILARITY_THRESHOLD) {
          report.modified.push({
            nodeId,
            changes: attributeChanges,
            confidence: Math.min(1.0, similarity * 0.5 + 0.5), // Heuristic confidence
          });
        }
      }
    }

    // 2. Edge Comparison
    const edgesA = new Map<string, Edge>(graphA.edges.map(e => [e.id, e]));
    const edgesB = new Map<string, Edge>(graphB.edges.map(e => [e.id, e]));

    const allEdgeIds = new Set([...edgesA.keys(), ...edgesB.keys()]);
    for (const edgeId of allEdgeIds) {
      const edgeA = edgesA.get(edgeId);
      const edgeB = edgesB.get(edgeId);

      if (!edgeA) {
        report.added.push({ nodeId: edgeId, details: edgeB }); // Reusing nodeId for simplicity in diff report structure
        continue;
      }
      if (!edgeB) {
        report.removed.push({ nodeId: edgeId, details: edgeA });
        continue;
      }

      const edgeSimilarity = this.calculateEdgeSimilarity(edgeA, edgeB);
      if (edgeSimilarity < this.SIMILARITY_THRESHOLD) {
        const attributesChanged = this.compareAttributes(edgeA, edgeB);
        if (attributesChanged.length > 0 || edgeSimilarity < this.SIMILARITY_THRESHOLD) {
          report.modified.push({
            nodeId: edgeId,
            changes: [{ attribute: "semantic_weight", from: edgeA.weight, to: edgeB.weight }],
            confidence: Math.min(1.0, edgeSimilarity * 0.5 + 0.5),
          });
        }
      }
    }

    // 3. Semantic Drift Detection (Focusing on structural/implied changes)
    this.detectSemanticDrift(graphA, graphB, report);

    return report;
  }

  private calculateNodeSimilarity(nodeA: Node, nodeB: Node): SemanticSimilarity {
    // Placeholder for actual embedding comparison (e.g., Cosine Similarity)
    // Assume nodes have an 'embedding' field: number[]
    if (!nodeA.embedding || !nodeB.embedding) return 0.0;

    // Mock similarity calculation based on length difference as a proxy
    const diff = Math.abs(nodeA.embedding.length - nodeB.embedding.length);
    return Math.max(0.0, 1.0 - (diff * 0.1));
  }

  private calculateEdgeSimilarity(edgeA: Edge, edgeB: Edge): SemanticSimilarity {
    // Placeholder for actual relationship embedding comparison
    if (!edgeA.embedding || !edgeB.embedding) return 0.0;

    const diff = Math.abs(edgeA.embedding.length - edgeB.embedding.length);
    return Math.max(0.0, 1.0 - (diff * 0.1));
  }

  private compareAttributes(objA: { [key: string]: any }, objB: { [key: string]: any }): { attribute: string; from: any; to: any }[] {
    const changes: { attribute: string; from: any; to: any }[] = [];
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      if (key === 'id') continue; // Skip ID comparison

      const valA = objA[key];
      const valB = objB[key];

      if (valA !== undefined && valB !== undefined && valA !== valB) {
        changes.push({ attribute: key, from: valA, to: valB });
      } else if (valA === undefined && valB !== undefined) {
        changes.push({ attribute: key, from: undefined, to: valB });
      } else if (valA !== undefined && valB === undefined) {
        changes.push({ attribute: key, from: valA, to: undefined });
      }
    }
    return changes;
  }

  private detectSemanticDrift(graphA: Graph, graphB: Graph, report: DiffReport): void {
    // Check for nodes that exist in both but whose connections have changed significantly
    const nodesA = new Map<string, Node>(graphA.nodes.map(n => [n.id, n]));
    const nodesB = new Map<string, Node>(graphB.nodes.map(n => [n.id, n]));

    const commonNodeIds = new Set<string>();
    for (const id of nodesA.keys()) {
      if (nodesB.has(id)) {
        commonNodeIds.add(id);
      }
    }

    const edgesA = new Map<string, Edge>(graphA.edges.map(e => [e.id, e]));
    const edgesB = new Map<string, Edge>(graphB.edges.map(e => [e.id, e]));

    for (const edgeId of edgesA.keys()) {
      if (!edgesB.has(edgeId)) continue;

      const edgeA = edgesA.get(edgeId)!;
      const edgeB = edgesB.get(edgeId)!;

      // Check if the endpoints have drifted significantly
      const sourceDrift = this.calculateNodeSimilarity(nodesA.get(edgeA.sourceId)!, nodesB.get(edgeA.sourceId)!);
      const targetDrift = this.calculateNodeSimilarity(nodesA.get(edgeA.targetId)!, nodesB.get(edgeA.targetId)!);

      if (sourceDrift < this.SIMILARITY_THRESHOLD || targetDrift < this.SIMILARITY_THRESHOLD) {
        report.semanticallyDrifted.push({
          edgeId,
          reason: `Endpoint semantic drift detected (Source Sim: ${sourceDrift.toFixed(2)}, Target Sim: ${targetDrift.toFixed(2)})`,
          confidence: Math.min(1.0, (1 - sourceDrift) + (1 - targetDrift) / 2),
        });
      }
    }
  }
}