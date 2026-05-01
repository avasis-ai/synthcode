import { Graph, Node, Edge } from "./graph-types";

export class SemanticContextGraphDiffer {
    private readonly embeddingSimilarityThreshold: number;

    constructor(embeddingSimilarityThreshold: number = 0.7) {
        this.embeddingSimilarityThreshold = embeddingSimilarityThreshold;
    }

    private calculateCosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
        if (vecA.length !== vecB.length || vecA.length === 0) {
            return 0.0;
        }
        let dotProduct = 0.0;
        let normA = 0.0;
        let normB = 0.0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const magnitudeA = Math.sqrt(normA);
        const magnitudeB = Math.sqrt(normB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0.0;
        }

        return dotProduct / (magnitudeA * magnitudeB);
    }

    private compareNodes(sourceGraph: Graph, targetGraph: Graph): { diffs: { nodeId: string, score: number, reason: string }[], structuralChanges: { nodeId: string, status: "MISSING" | "ADDED" | "CHANGED" }[] } {
        const sourceNodes = new Map<string, Node>();
        sourceGraph.nodes.forEach(node => sourceNodes.set(node.id, node));

        const targetNodesMap = new Map<string, Node>();
        targetGraph.nodes.forEach(node => targetNodesMap.set(node.id, node));

        const diffs: { nodeId: string, score: number, reason: string }[] = [];
        const structuralChanges: { nodeId: string, status: "MISSING" | "ADDED" | "CHANGED" }[] = [];

        // Check for changes and missing nodes
        for (const [id, sourceNode] of sourceNodes.entries()) {
            const targetNode = targetNodesMap.get(id);
            if (!targetNode) {
                structuralChanges.push({ nodeId: id, status: "MISSING" });
                continue;
            }

            // Semantic comparison (assuming embeddings are present)
            if (sourceNode.embedding && targetNode.embedding) {
                const similarity = this.calculateCosineSimilarity(sourceNode.embedding, targetNode.embedding);
                const driftScore = 1.0 - similarity; // Higher score means more drift
                diffs.push({ nodeId: id, score: driftScore, reason: `Embedding Drift: ${similarity.toFixed(3)}` });
            } else {
                // Fallback comparison (e.g., label comparison)
                const labelMatch = sourceNode.label === targetNode.label;
                const driftScore = labelMatch ? 0.0 : 0.5;
                diffs.push({ nodeId: id, score: driftScore, reason: `Label Match: ${sourceNode.label} vs ${targetNode.label}` });
            }

            // Check for attribute changes (simplified)
            if (sourceNode.attributes && JSON.stringify(sourceNode.attributes) !== JSON.stringify(targetNode.attributes)) {
                structuralChanges.push({ nodeId: id, status: "CHANGED" });
            }
        }

        // Check for added nodes
        for (const id of targetNodesMap.keys()) {
            if (!sourceNodes.has(id)) {
                structuralChanges.push({ nodeId: id, status: "ADDED" });
            }
        }

        return { diffs, structuralChanges };
    }

    private compareEdges(sourceGraph: Graph, targetGraph: Graph): { diffs: { edgeId: string, score: number, reason: string }[], structuralChanges: { edgeId: string, status: "MISSING" | "ADDED" | "CHANGED" }[] } {
        const sourceEdges = new Map<string, Edge>();
        sourceGraph.edges.forEach(edge => sourceEdges.set(edge.id, edge));

        const targetEdgesMap = new Map<string, Edge>();
        targetGraph.edges.forEach(edge => targetEdgesMap.set(edge.id, edge));

        const diffs: { edgeId: string, score: number, reason: string }[] = [];
        const structuralChanges: { edgeId: string, status: "MISSING" | "ADDED" | "CHANGED" }[] = [];

        // Check for changes and missing edges
        for (const [id, sourceEdge] of sourceEdges.entries()) {
            const targetEdge = targetEdgesMap.get(id);
            if (!targetEdge) {
                structuralChanges.push({ edgeId: id, status: "MISSING" });
                continue;
            }

            // Semantic comparison (assuming embeddings are present)
            if (sourceEdge.embedding && targetEdge.embedding) {
                const similarity = this.calculateCosineSimilarity(sourceEdge.embedding, targetEdge.embedding);
                const driftScore = 1.0 - similarity;
                diffs.push({ edgeId: id, score: driftScore, reason: `Embedding Drift: ${similarity.toFixed(3)}` });
            } else {
                const labelMatch = sourceEdge.label === targetEdge.label;
                const driftScore = labelMatch ? 0.0 : 0.5;
                diffs.push({ edgeId: id, score: driftScore, reason: `Label Match: ${sourceEdge.label} vs ${targetEdge.label}` });
            }

            // Check for attribute changes
            if (sourceEdge.attributes && JSON.stringify(sourceEdge.attributes) !== JSON.stringify(targetEdge.attributes)) {
                structuralChanges.push({ edgeId: id, status: "CHANGED" });
            }
        }

        // Check for added edges
        for (const id of targetEdgesMap.keys()) {
            if (!sourceEdges.has(id)) {
                structuralChanges.push({ edgeId: id, status: "ADDED" });
            }
        }

        return { diffs, structuralChanges };
    }

    public diff(sourceGraph: Graph, targetGraph: Graph): {
        semanticGaps: { id: string, score: number, reason: string }[];
        structuralChanges: { nodeId: string, status: "MISSING" | "ADDED" | "CHANGED" }[];
        edgeChanges: { edgeId: string, status: "MISSING" | "ADDED" | "CHANGED" }[];
        overallDriftScore: number;
    } {
        const nodeDiff = this.compareNodes(sourceGraph, targetGraph);
        const edgeDiff = this.compareEdges(sourceGraph, targetGraph);

        const totalDriftScore = nodeDiff.diffs.reduce((sum, diff) => sum + diff.score, 0) +
                                edgeDiff.diffs.reduce((sum, diff) => sum + diff.score, 0);

        return {
            semanticGaps: nodeDiff.diffs.filter(d => d.score > (1.0 - this.embeddingSimilarityThreshold)),
            structuralChanges: nodeDiff.structuralChanges,
            edgeChanges: edgeDiff.structuralChanges,
            overallDriftScore: Math.min(1.0, totalDriftScore / (nodeDiff.diffs.length + edgeDiff.diffs.length + 1)),
        };
    }
}