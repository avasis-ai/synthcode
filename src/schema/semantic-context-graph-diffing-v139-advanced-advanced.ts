import { Graph, Node, Edge } from "./graph-types";

export class SemanticContextGraphDiffer {
    private embeddingDistance: (nodeA: Node, nodeB: Node) => number;
    private gapScoringWeight: number;

    constructor(embeddingDistance: (nodeA: Node, nodeB: Node) => number, gapScoringWeight: number = 0.5) {
        this.embeddingDistance = embeddingDistance;
        this.gapScoringWeight = gapScoringWeight;
    }

    private calculateConceptualGapScore(
        sourceGraph: Graph,
        targetGraph: Graph,
        nodeId: string,
        relationshipType: string
    ): number {
        const sourceEdges = sourceGraph.getEdgesFromNode(nodeId);
        const targetEdges = targetGraph.getEdgesFromNode(nodeId);

        const sourceTypes = new Set(sourceEdges.map(e => e.type));
        const targetTypes = new Set(targetEdges.map(e => e.type));

        const missingTypes = Array.from(sourceTypes).filter(type => !targetTypes.has(type));
        const newlyAppearedTypes = Array.from(targetTypes).filter(type => !sourceTypes.has(type));

        let gapScore = 0;

        if (missingTypes.length > 0) {
            gapScore += missingTypes.length * 1.5;
        }
        if (newlyAppearedTypes.length > 0) {
            gapScore += newlyAppearedTypes.length * 1.0;
        }

        return gapScore * this.gapScoringWeight;
    }

    private compareGraphStructure(
        sourceGraph: Graph,
        targetGraph: Graph
    ): { structuralDiff: Record<string, any>; conceptualGapScore: number } {
        const structuralDiff: Record<string, any> = {
            nodeChanges: {},
            edgeChanges: {},
            conceptualGaps: []
        };

        const allNodeIds = new Set([...sourceGraph.getNodes().map(n => n.id), ...targetGraph.getNodes().map(n => n.id)]);

        for (const nodeId of allNodeIds) {
            const sourceNode = sourceGraph.getNode(nodeId);
            const targetNode = targetGraph.getNode(nodeId);

            if (!sourceNode) {
                structuralDiff.nodeChanges[nodeId] = { status: "ADDED", details: targetNode };
                continue;
            }
            if (!targetNode) {
                structuralDiff.nodeChanges[nodeId] = { status: "REMOVED", details: sourceNode };
                continue;
            }

            // Check for attribute drift
            const attributesMatch = JSON.stringify(sourceNode.attributes) === JSON.stringify(targetNode.attributes);
            if (!attributesMatch) {
                structuralDiff.nodeChanges[nodeId] = { status: "MODIFIED", details: { source: sourceNode.attributes, target: targetNode.attributes } };
            } else {
                structuralDiff.nodeChanges[nodeId] = { status: "UNCHANGED" };
            }
        }

        // Edge comparison and gap scoring
        let totalGapScore = 0;
        const allNodeIdsForEdges = new Set([...sourceGraph.getNodes().map(n => n.id), ...targetGraph.getNodes().map(n => n.id)]);

        for (const nodeId of allNodeIdsForEdges) {
            const sourceEdges = sourceGraph.getEdgesFromNode(nodeId);
            const targetEdges = targetGraph.getEdgesFromNode(nodeId);

            // Simple edge count/presence check
            const sourceEdgeCount = sourceEdges.length;
            const targetEdgeCount = targetEdges.length;

            if (sourceEdgeCount !== targetEdgeCount) {
                structuralDiff.edgeChanges[nodeId] = { status: "COUNT_MISMATCH", sourceCount: sourceEdgeCount, targetCount: targetEdgeCount };
            }

            // Conceptual Gap Analysis
            const gapScore = this.calculateConceptualGapScore(sourceGraph, targetGraph, nodeId, "N/A");
            if (gapScore > 0.1) {
                structuralDiff.conceptualGaps.push({
                    nodeId: nodeId,
                    score: gapScore,
                    description: "Semantic relationship divergence detected."
                });
                totalGapScore += gapScore;
            }
        }

        return {
            structuralDiff,
            conceptualGapScore: totalGapScore
        };
    }

    /**
     * Performs advanced semantic context graph differencing.
     * @param sourceGraph The initial context graph.
     * @param targetGraph The new context graph.
     * @returns A structured report detailing conceptual shifts and structural changes.
     */
    public diff(sourceGraph: Graph, targetGraph: Graph): { report: any; overallDriftScore: number } {
        const { structuralDiff, conceptualGapScore } = this.compareGraphStructure(sourceGraph, targetGraph);

        const overallDriftScore = Math.sqrt(
            (Object.keys(structuralDiff.nodeChanges).length / 10) +
            (Object.keys(structuralDiff.edgeChanges).length / 10) +
            conceptualGapScore
        );

        const report = {
            timestamp: new Date().toISOString(),
            sourceGraphSummary: { nodeCount: sourceGraph.getNodes().length, edgeCount: sourceGraph.getEdges().length },
            targetGraphSummary: { nodeCount: targetGraph.getNodes().length, edgeCount: targetGraph.getEdges().length },
            structuralDifferences: structuralDiff.nodeChanges,
            edgeDifferences: structuralDiff.edgeChanges,
            conceptualShiftReport: structuralDiff.conceptualGaps,
            overallConceptualDriftScore: conceptualGapScore
        };

        return { report, overallDriftScore };
    }
}