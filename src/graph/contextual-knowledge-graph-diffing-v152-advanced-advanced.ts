import { GraphState, ContextPayload, KnowledgeGraphDiffReport, SemanticImpactScore, GraphNode, GraphEdge, ConstraintDefinition } from "./types";

export class ContextualKnowledgeGraphDiffer {
    private readonly constraints: Map<string, ConstraintDefinition>;

    constructor(constraints: ConstraintDefinition[]) {
        this.constraints = new Map(constraints.map(c => [c.name, c]));
    }

    private calculateSemanticImpact(
        diff: { nodes: { added: GraphNode[]; removed: GraphNode[]; updated: GraphNode[] }; edges: { added: GraphEdge[]; removed: GraphEdge[]; updated: GraphEdge[] } },
        context: ContextPayload,
        previousGraph: GraphState
    ): { impactReport: string; score: SemanticImpactScore } {
        let impactDetails: string[] = [];
        let totalScore: SemanticImpactScore = 0;

        const checkConstraintViolation = (constraint: ConstraintDefinition, affectedNodes: GraphNode[], affectedEdges: GraphEdge[]): string | null => {
            const violation = affectedNodes.some(node => constraint.appliesToNode(node) && !constraint.isValid(node, previousGraph));
            const edgeViolation = affectedEdges.some(edge => constraint.appliesToEdge(edge) && !constraint.isValid(edge, previousGraph));

            if (violation || edgeViolation) {
                const severity = violation ? "High" : "Medium";
                const message = `Violates Constraint ${constraint.name}: ${constraint.description}. Affected by ${violation ? 'Node' : 'Edge'} changes.`;
                return message;
            }
            return null;
        };

        // 1. Check Node Impacts
        for (const node of diff.nodes.added.concat(diff.nodes.updated)) {
            for (const [name, constraint] of this.constraints.entries()) {
                const violation = checkConstraintViolation(constraint, [node], []);
                if (violation) {
                    impactDetails.push(violation);
                    totalScore += 3;
                }
            }
        }

        // 2. Check Edge Impacts
        for (const edge of diff.edges.added.concat(diff.edges.updated)) {
            for (const [name, constraint] of this.constraints.entries()) {
                const violation = checkConstraintViolation(constraint, [], [edge]);
                if (violation) {
                    impactDetails.push(violation);
                    totalScore += 2;
                }
            }
        }

        const impactReport = impactDetails.length > 0
            ? `Potential Impact Detected: ${impactDetails.join(' | ')}`
            : "No immediate constraint violations detected based on structural changes.";

        return { impactReport, score: totalScore };
    }

    public diff(
        previousGraph: GraphState,
        currentGraph: GraphState,
        context: ContextPayload
    ): KnowledgeGraphDiffReport {
        const nodeDiff = this.diffNodes(previousGraph, currentGraph);
        const edgeDiff = this.diffEdges(previousGraph, currentGraph);

        const diff = {
            nodes: {
                added: nodeDiff.added,
                removed: nodeDiff.removed,
                updated: nodeDiff.updated,
            },
            edges: {
                added: edgeDiff.added,
                removed: edgeDiff.removed,
                updated: edgeDiff.updated,
            }
        };

        const { impactReport, score } = this.calculateSemanticImpact(diff, context, previousGraph);

        return {
            structuralDiff: diff,
            semanticImpact: {
                report: impactReport,
                score: score,
                severity: score > 4 ? "High" : (score > 1 ? "Medium" : "Low")
            },
            contextualSummary: `Contextual analysis complete. Graph changes processed against ${this.constraints.size} constraints.`
        };
    }

    private diffNodes(previous: GraphState, current: GraphState): { added: GraphNode[]; removed: GraphNode[]; updated: GraphNode[] } {
        const added: GraphNode[] = [];
        const removed: GraphNode[] = [];
        const updated: GraphNode[] = [];

        const prevNodes = new Map<string, GraphNode>(previous.nodes.map(n => [n.id, n]));
        const currNodes = new Map<string, GraphNode>(current.nodes.map(n => [n.id, n]));

        // Added/Updated
        for (const [id, node] of currNodes.entries()) {
            const prevNode = prevNodes.get(id);
            if (!prevNode) {
                added.push(node);
            } else if (JSON.stringify(node.properties) !== JSON.stringify(prevNode.properties)) {
                updated.push(node);
            }
        }

        // Removed
        for (const [id, node] of prevNodes.entries()) {
            if (!currNodes.has(id)) {
                removed.push(node);
            }
        }

        return { added, removed, updated };
    }

    private diffEdges(previous: GraphState, current: GraphState): { added: GraphEdge[]; removed: GraphEdge[]; updated: GraphEdge[] } {
        const added: GraphEdge[] = [];
        const removed: GraphEdge[] = [];
        const updated: GraphEdge[] = [];

        const prevEdges = new Map<string, GraphEdge>(previous.edges.map(e => [`${e.source}-${e.target}`, e]));
        const currEdges = new Map<string, GraphEdge>(current.edges.map(e => [`${e.source}-${e.target}`, e]));

        // Added/Updated
        for (const [key, edge] of currEdges.entries()) {
            const prevEdge = prevEdges.get(key);
            if (!prevEdge) {
                added.push(edge);
            } else if (JSON.stringify(edge.properties) !== JSON.stringify(prevEdge.properties)) {
                updated.push(edge);
            }
        }

        // Removed
        for (const [key, edge] of prevEdges.entries()) {
            if (!currEdges.has(key)) {
                removed.push(edge);
            }
        }

        return { added, removed, updated };
    }
}