import { GraphState, Node, Edge, Context } from "./types";

export class ContextualKnowledgeGraphDiffer {
    private readonly context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    public diff(graphA: GraphState, graphB: GraphState): DiffReport {
        const nodeDiffs = this.diffNodes(graphA.nodes, graphB.nodes);
        const edgeDiffs = this.diffEdges(graphA.edges, graphB.edges, nodeDiffs);

        return {
            nodeChanges: nodeDiffs,
            edgeChanges: edgeDiffs,
            summary: this.generateSummary(nodeDiffs, edgeDiffs),
        };
    }

    private diffNodes(nodesA: Map<string, Node>, nodesB: Map<string, Node>): Record<string, { status: "added" | "deleted" | "modified"; details: any }> {
        const nodeDiffs: Record<string, { status: "added" | "deleted" | "modified"; details: any }> = {};

        // Check for modifications and deletions
        for (const [id, nodeA] of nodesA.entries()) {
            const nodeB = nodesB.get(id);
            if (!nodeB) {
                nodeDiffs[id] = { status: "deleted", details: nodeA };
            } else {
                const attributesChanged = this.compareAttributes(nodeA.attributes, nodeB.attributes);
                if (attributesChanged || this.compareContextualData(nodeA, nodeB)) {
                    nodeDiffs[id] = { status: "modified", details: { old: nodeA, new: nodeB, attributesChanged } };
                } else {
                    nodeDiffs[id] = { status: "unchanged", details: null };
                }
            }
        }

        // Check for additions
        for (const [id, nodeB] of nodesB.entries()) {
            if (!nodesA.has(id)) {
                nodeDiffs[id] = { status: "added", details: nodeB };
            }
        }
        return nodeDiffs;
    }

    private diffEdges(edgesA: Map<string, Edge>, edgesB: Map<string, Edge>, nodeDiffs: Record<string, { status: "added" | "deleted" | "modified"; details: any }>): Record<string, { status: "added" | "deleted" | "modified"; details: any }> {
        const edgeDiffs: Record<string, { status: "added" | "deleted" | "modified"; details: any }> = {};

        // Edges are keyed by a combination of source, target, and type for uniqueness
        const getEdgeKey = (source: string, target: string, type: string): string => `${source}->${target}:${type}`;

        // Check for modifications and deletions
        for (const [key, edgeA] of edgesA.entries()) {
            const edgeB = edgesB.get(key);
            if (!edgeB) {
                edgeDiffs[key] = { status: "deleted", details: edgeA };
            } else {
                const attributesChanged = this.compareAttributes(edgeA.attributes, edgeB.attributes);
                if (attributesChanged || this.compareContextualData(edgeA, edgeB)) {
                    edgeDiffs[key] = { status: "modified", details: { old: edgeA, new: edgeB, attributesChanged } };
                } else {
                    edgeDiffs[key] = { status: "unchanged", details: null };
                }
            }
        }

        // Check for additions
        for (const [key, edgeB] of edgesB.entries()) {
            if (!edgesA.has(key)) {
                edgeDiffs[key] = { status: "added", details: edgeB };
            }
        }
        return edgeDiffs;
    }

    private compareAttributes(attrsA: Record<string, unknown>, attrsB: Record<string, unknown>): boolean {
        const keysA = Object.keys(attrsA);
        const keysB = Object.keys(attrsB);

        if (keysA.length !== keysB.length) return true;

        for (const key of keysA) {
            if (!(key in attrsB)) return true;
            const valA = attrsA[key];
            const valB = attrsB[key];

            if (typeof valA === 'object' && valA !== null && typeof valB === 'object' && valB !== null) {
                if (JSON.stringify(valA) !== JSON.stringify(valB)) return true;
            } else if (valA !== valB) {
                return true;
            }
        }
        return false;
    }

    private compareContextualData(a: { attributes: Record<string, unknown> }, b: { attributes: Record<string, unknown> }): boolean {
        // Placeholder for complex context comparison (e.g., temporal validity, relationship context)
        // In a real implementation, this would use the 'Context' object.
        const contextCheck = this.context.validateContext(a, b);
        return contextCheck !== true;
    }

    private generateSummary(nodeDiffs: Record<string, any>, edgeDiffs: Record<string, any>): { added: number; deleted: number; modified: number } {
        let added = 0;
        let deleted = 0;
        let modified = 0;

        for (const key in nodeDiffs) {
            const diff = nodeDiffs[key];
            if (diff.status === "added") added++;
            else if (diff.status === "deleted") deleted++;
            else if (diff.status === "modified") modified++;
        }

        for (const key in edgeDiffs) {
            const diff = edgeDiffs[key];
            if (diff.status === "added") added++;
            else if (diff.status === "deleted") deleted++;
            else if (diff.status === "modified") modified++;
        }

        return { added, deleted, modified };
    }
}

export interface DiffReport {
    nodeChanges: Record<string, { status: "added" | "deleted" | "modified"; details: any }>;
    edgeChanges: Record<string, { status: "added" | "deleted" | "modified"; details: any }>;
    summary: { added: number; deleted: number; modified: number };
}

// Mock types needed for compilation context
export interface Node {
    id: string;
    attributes: Record<string, unknown>;
    contextualData?: Record<string, unknown>;
}

export interface Edge {
    source: string;
    target: string;
    type: string;
    attributes: Record<string, unknown>;
    contextualData?: Record<string, unknown>;
}

export interface GraphState {
    nodes: Map<string, Node>;
    edges: Map<string, Edge>;
}

export interface Context {
    validateContext(a: any, b: any): boolean;
}