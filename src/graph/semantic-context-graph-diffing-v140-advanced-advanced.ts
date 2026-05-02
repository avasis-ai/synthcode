import { GraphPayload, ComparisonRules, DiffReport, GraphNode, GraphEdge } from "./types";

type SemanticSimilarity = (a: any, b: any) => number;

interface GraphDiffingService {
    compareGraphs(graphA: GraphPayload, graphB: GraphPayload, rules: ComparisonRules): DiffReport;
}

export class SemanticContextGraphDiffer {
    private readonly similarityMetric: SemanticSimilarity;

    constructor(similarityMetric: SemanticSimilarity) {
        this.similarityMetric = similarityMetric;
    }

    private compareNodes(nodeA: GraphNode, nodeB: GraphNode, rules: ComparisonRules): { diff: 'drifted' | 'missing' | 'new'; score: number; details: string } {
        const idMatch = nodeA.id === nodeB.id;
        const semanticScore = this.similarityMetric(nodeA.embedding, nodeB.embedding);

        if (!idMatch) {
            return { diff: 'missing', score: 0, details: `Node ${nodeA.id} missing in B.` };
        }

        const metadataDrift = JSON.stringify(nodeA.metadata) !== JSON.stringify(nodeB.metadata);
        const semanticDrift = semanticScore < rules.minSemanticSimilarity;

        if (metadataDrift || semanticDrift) {
            const severity = (metadataDrift ? 0.4 : 0) + (semanticDrift ? 0.6 : 0);
            return { diff: 'drifted', score: severity, details: `Metadata or embedding drifted. Score: ${semanticScore.toFixed(2)}` };
        }

        return { diff: 'ok', score: 1.0, details: 'No significant drift detected.' };
    }

    private compareEdges(edgeA: GraphEdge, graphB: GraphPayload, rules: ComparisonRules): { diff: 'drifted' | 'missing' | 'new'; score: number; details: string } {
        const sourceMatch = graphB.nodes.some(n => n.id === edgeA.sourceId);
        const targetMatch = graphB.nodes.some(n => n.id === edgeA.targetId);

        if (!sourceMatch || !targetMatch) {
            return { diff: 'missing', score: 0.1, details: `Edge ${edgeA.id} references missing node(s).` };
        }

        const edgeTypeMatch = edgeA.type === 'SEMANTIC_MATCH'; // Simplified check for demonstration
        const semanticScore = this.similarityMetric(edgeA.embedding, 'dummy_edge_embedding'); // Placeholder for edge embedding comparison

        if (!edgeTypeMatch || semanticScore < rules.minEdgeSimilarity) {
            return { diff: 'drifted', score: 0.7, details: `Edge type or embedding drifted. Score: ${semanticScore.toFixed(2)}` };
        }

        return { diff: 'ok', score: 1.0, details: 'Edge relationship stable.' };
    }

    public compareGraphs(graphA: GraphPayload, graphB: GraphPayload, rules: ComparisonRules): DiffReport {
        const nodeDiffs: { diff: 'drifted' | 'missing' | 'new'; score: number; details: string }[] = [];
        const edgeDiffs: { diff: 'drifted' | 'missing' | 'new'; score: number; details: string }[] = [];

        // 1. Node Comparison
        const nodesA = new Map<string, GraphNode>(graphA.nodes.map(n => [n.id, n]));
        const nodesB = new Map<string, GraphNode>(graphB.nodes.map(n => [n.id, n]));

        // Check for existing/drifted nodes
        for (const [id, nodeA] of nodesA.entries()) {
            const nodeB = nodesB.get(id);
            if (nodeB) {
                nodeDiffs.push(this.compareNodes(nodeA, nodeB, rules));
            } else {
                nodeDiffs.push({ diff: 'missing', score: 0.9, details: `Node ${id} present in A but missing in B.` });
            }
        }

        // Check for new nodes
        for (const [id, nodeB] of nodesB.entries()) {
            if (!nodesA.has(id)) {
                nodeDiffs.push({ diff: 'new', score: 0.9, details: `Node ${id} present in B but new.` });
            }
        }

        // 2. Edge Comparison (Simplified: comparing edges in A against existence in B)
        const edgesA = graphA.edges;
        const edgesB = graphB.edges;

        // Check for drifted/missing edges (Iterate over A)
        for (const edgeA of edgesA) {
            // In a real scenario, we'd find the best match in edgesB using semantic similarity
            const bestMatch = edgesB.find(edgeB => edgeB.sourceId === edgeA.sourceId && edgeB.targetId === edgeA.targetId);

            if (!bestMatch) {
                edgeDiffs.push({ diff: 'missing', score: 0.8, details: `Edge ${edgeA.id} missing in B.` });
            } else {
                const diffResult = this.compareEdges(edgeA, graphB, rules);
                edgeDiffs.push({ diff: diffResult.diff, score: diffResult.score, details: `Edge ${edgeA.id}: ${diffResult.details}` });
            }
        }

        // Check for new edges (Simplified: count unique edges in B not in A)
        const edgeIdsA = new Set(edgesA.map(e => e.id));
        for (const edgeB of edgesB) {
            if (!edgeIdsA.has(edgeB.id)) {
                edgeDiffs.push({ diff: 'new', score: 0.8, details: `Edge ${edgeB.id} new in B.` });
            }
        }

        return {
            nodeDiffs: nodeDiffs,
            edgeDiffs: edgeDiffs,
            summary: {
                totalNodesA: graphA.nodes.length,
                totalNodesB: graphB.nodes.length,
                totalEdgesA: graphA.edges.length,
                totalEdgesB: graphB.edges.length,
            }
        };
    }
}