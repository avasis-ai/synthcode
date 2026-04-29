import { GraphPayload, Node, Edge, MergeWeights } from "./graph-types";

export class SemanticContextGraphMergerV101 {
    private readonly defaultMergeWeights: MergeWeights;

    constructor(weights?: MergeWeights) {
        this.defaultMergeWeights = weights || {
            trust: 0.5,
            recency: 0.5
        };
    }

    private resolveAttributeConflict(
        key: string,
        values: (string | number | boolean)[],
        weights: MergeWeights
    ): any {
        if (values.length === 0) {
            return undefined;
        }

        // Simple conflict resolution: prioritize the value from the highest weighted source.
        // For simplicity, we'll just take the most recent one if weights are equal,
        // or the first one encountered if weights are complex to track here.
        // In a real system, this would involve deep merging based on the source's weight.
        if (values.length === 1) {
            return values[0];
        }

        // Heuristic: If types are mixed, stringify and take the first.
        const firstValue = values[0];
        const lastValue = values[values.length - 1];

        if (typeof firstValue !== typeof lastValue) {
            return String(firstValue);
        }

        // If all are strings, join them (assuming they are descriptive attributes)
        if (typeof firstValue === 'string') {
            return values.filter(v => v !== null && v !== undefined).join(" | ");
        }

        // Otherwise, take the last one as a proxy for "most updated"
        return lastValue;
    }

    private mergeNodes(
        existingNodes: Map<string, Node>,
        newNodes: Node[],
        weights: MergeWeights
    ): Map<string, Node> {
        const mergedNodes = new Map(existingNodes);

        for (const newNode of newNodes) {
            const nodeId = newNode.id;
            if (!mergedNodes.has(nodeId)) {
                mergedNodes.set(nodeId, newNode);
                continue;
            }

            const existingNode = mergedNodes.get(nodeId)!;
            const mergedNode: Node = {
                ...existingNode,
                ...newNode,
                attributes: {
                    ...existingNode.attributes,
                    ...newNode.attributes,
                    // Resolve conflicts for attributes
                    ...Object.keys(existingNode.attributes).reduce((acc, key) => {
                        const existingVal = existingNode.attributes[key];
                        const newVal = newNode.attributes[key];
                        if (newVal !== undefined && existingVal !== undefined) {
                            acc[key] = this.resolveAttributeConflict(key, [existingVal, newVal], weights);
                        } else {
                            acc[key] = existingVal;
                        }
                        return acc;
                    }, {}),
                    ...Object.keys(newNode.attributes).reduce((acc, key) => {
                        if (!(key in existingNode.attributes)) {
                            acc[key] = newNode.attributes[key];
                        }
                        return acc;
                    }, {})
                }
            };
            mergedNodes.set(nodeId, mergedNode);
        }
        return mergedNodes;
    }

    private mergeEdges(
        existingEdges: Map<string, Edge>,
        newEdges: Edge[],
        weights: MergeWeights
    ): Map<string, Edge> {
        const mergedEdges = new Map(existingEdges);

        for (const newEdge of newEdges) {
            const edgeKey = `${newEdge.sourceId}->${newEdge.targetId}`;
            if (!mergedEdges.has(edgeKey)) {
                mergedEdges.set(edgeKey, newEdge);
                continue;
            }

            const existingEdge = mergedEdges.get(edgeKey)!;
            const mergedEdge: Edge = {
                ...existingEdge,
                ...newEdge,
                attributes: {
                    ...existingEdge.attributes,
                    ...newEdge.attributes,
                    ...Object.keys(existingEdge.attributes).reduce((acc, key) => {
                        const existingVal = existingEdge.attributes[key];
                        const newVal = newEdge.attributes[key];
                        if (newVal !== undefined && existingVal !== undefined) {
                            acc[key] = this.resolveAttributeConflict(key, [existingVal, newVal], weights);
                        } else {
                            acc[key] = existingVal;
                        }
                        return acc;
                    }, {}),
                    ...Object.keys(newEdge.attributes).reduce((acc, key) => {
                        if (!(key in existingEdge.attributes)) {
                            acc[key] = newEdge.attributes[key];
                        }
                        return acc;
                    }, {})
                }
            };
            mergedEdges.set(edgeKey, mergedEdge);
        }
        return mergedEdges;
    }

    public mergeGraphs(
        graphPayloads: GraphPayload[],
        weights: MergeWeights = this.defaultMergeWeights
    ): GraphPayload {
        let allNodes: Node[] = [];
        let allEdges: Edge[] = [];

        for (const payload of graphPayloads) {
            allNodes.push(...payload.nodes);
            allEdges.push(...payload.edges);
        }

        const nodeMap = new Map<string, Node>();
        const edgeMap = new Map<string, Edge>();

        // 1. Merge Nodes
        let currentNodes: Map<string, Node> = new Map();
        for (const payload of graphPayloads) {
            const nodesMap = new Map<string, Node>();
            for (const node of payload.nodes) {
                nodesMap.set(node.id, node);
            }
            currentNodes = this.mergeNodes(currentNodes, Array.from(nodesMap.values()), weights);
        }

        // 2. Merge Edges
        let currentEdges: Map<string, Edge> = new Map();
        for (const payload of graphPayloads) {
            const edgesMap = new Map<string, Edge>();
            for (const edge of payload.edges) {
                edgesMap.set(`${edge.sourceId}->${edge.targetId}`, edge);
            }
            currentEdges = this.mergeEdges(currentEdges, Array.from(edgesMap.values()), weights);
        }

        return {
            nodes: Array.from(currentNodes.values()),
            edges: Array.from(currentEdges.values()),
            metadata: {
                mergedFromSources: graphPayloads.map(p => p.sourceId),
                mergeWeightsUsed: weights
            }
        };
    }
}