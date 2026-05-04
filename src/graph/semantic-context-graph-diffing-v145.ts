import { Graph, Node, Edge } from "./graph-types";

type ComparisonRule = {
  nodeProperty: (a: any, b: any) => number;
  edgeProperty: (a: any, b: any) => number;
};

interface SemanticDiffReport {
  nodeDiffs: {
    nodeId: string;
    semanticDrift: number;
    details: string;
  }[];
  edgeDiffs: {
    edgeId: string;
    semanticDrift: number;
    details: string;
  }[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    semanticDriftScore: number;
  };
}

export class SemanticContextGraphDiffer {
  private rules: ComparisonRule[];

  constructor(rules: ComparisonRule[]) {
    this.rules = rules;
  }

  private calculateSemanticSimilarity(a: any, b: any): number {
    // Placeholder for actual embedding comparison (e.g., Cosine Similarity)
    // In a real scenario, this would use vector math.
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) / (Math.abs(a) + Math.abs(b) || 1);
    }
    return 1.0 - Math.random() * 0.2; // Simulate some similarity
  }

  private compareNodes(nodeA: Node, nodeB: Node): { semanticDrift: number; details: string } {
    let maxDrift = 0;
    let details = "";

    for (const rule of this.rules) {
      const drift = rule.nodeProperty(nodeA.properties, nodeB.properties);
      if (drift > maxDrift) {
        maxDrift = drift;
      }
    }

    if (maxDrift > 0.1) {
      details = `High semantic drift detected based on properties. Max drift: ${maxDrift.toFixed(3)}`;
    } else {
      details = "Nodes appear semantically consistent.";
    }

    return { semanticDrift: maxDrift, details };
  }

  private compareEdges(edgeA: Edge, edgeB: Edge): { semanticDrift: number; details: string } {
    let maxDrift = 0;
    let details = "";

    for (const rule of this.rules) {
      const drift = rule.edgeProperty(edgeA.properties, edgeB.properties);
      if (drift > maxDrift) {
        maxDrift = drift;
      }
    }

    if (maxDrift > 0.1) {
      details = `High semantic drift detected on relationship. Max drift: ${maxDrift.toFixed(3)}`;
    } else {
      details = "Edges appear semantically consistent.";
    }

    return { semanticDrift: maxDrift, details };
  }

  public diff(graphA: Graph, graphB: Graph): SemanticDiffReport {
    const nodeDiffs: { nodeId: string; semanticDrift: number; details: string }[] = [];
    const edgeDiffs: { edgeId: string; semanticDrift: number; details: string }[] = [];
    let totalDriftScore = 0;

    // 1. Node Comparison (Assuming nodes are keyed by ID for simplicity)
    const nodesA = new Map<string, Node>(graphA.nodes.map(n => [n.id, n]));
    const nodesB = new Map<string, Node>(graphB.nodes.map(n => [n.id, n]));

    for (const [id, nodeA] of nodesA.entries()) {
      const nodeB = nodesB.get(id);
      if (nodeB) {
        const { semanticDrift, details } = this.compareNodes(nodeA, nodeB);
        nodeDiffs.push({ nodeId: id, semanticDrift, details });
        totalDriftScore += semanticDrift;
      }
    }

    // 2. Edge Comparison (Requires matching source/target pairs)
    const edgesA = new Map<string, Edge>(graphA.edges.map(e => [`${e.source}-${e.target}`, e]));
    const edgesB = new Map<string, Edge>(graphB.edges.map(e => [`${e.source}-${e.target}`, e]));

    for (const [key, edgeA] of edgesA.entries()) {
      const edgeB = edgesB.get(key);
      if (edgeB) {
        const { semanticDrift, details } = this.compareEdges(edgeA, edgeB);
        edgeDiffs.push({ edgeId: key, semanticDrift, details });
        totalDriftScore += semanticDrift;
      }
    }

    const summary: SemanticDiffReport["summary"] = {
      totalNodes: graphA.nodes.length,
      totalEdges: graphA.edges.length,
      semanticDriftScore: Math.min(1.0, totalDriftScore / (graphA.nodes.length + graphA.edges.length || 1)),
    };

    return {
      nodeDiffs,
      edgeDiffs,
      summary,
    };
  }
}