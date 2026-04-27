import { DependencyGraph } from "./dependency-graph.js";

export class DependencyGraphMerger {
    private graphs: DependencyGraph[];

    constructor(graphs: DependencyGraph[]) {
        this.graphs = graphs;
    }

    merge(): DependencyGraph {
        const mergedNodes = new Map<string, Map<string, any>>();
        const mergedEdges = new Set<string>();

        for (const graph of this.graphs) {
            for (const node of graph.nodes) {
                if (!mergedNodes.has(node.id)) {
                    mergedNodes.set(node.id, new Map<string, any>([
                        ["data", node.data],
                        ["dependencies", new Set<string>()]
                    ]));
                }
                const nodeMap = mergedNodes.get(node.id)!;

                // Conflict Resolution Strategy: Prefer the most detailed/non-empty data,
                // or simply union properties if they are objects.
                const existingData = nodeMap.get("data") as Record<string, any>;
                const incomingData = node.data;

                if (typeof incomingData === 'object' && incomingData !== null && typeof existingData === 'object' && existingData !== null) {
                    const mergedData: Record<string, any> = { ...existingData, ...incomingData };
                    nodeMap.set("data", mergedData);
                } else {
                    nodeMap.set("data", incomingData);
                }

                // Union dependencies
                const existingDeps = nodeMap.get("dependencies") as Set<string>;
                node.dependencies.forEach(dep => existingDeps.add(dep));
            }

            for (const edge of graph.edges) {
                const edgeKey = `${edge.source}-${edge.target}`;
                if (!mergedEdges.has(edgeKey)) {
                    mergedEdges.add(edgeKey);
                }
            }
        }

        const mergedNodesArray: DependencyGraph['nodes'] = Array.from(mergedNodes.entries()).map(([id, nodeMap]) => ({
            id: id,
            data: nodeMap.get("data") as Record<string, any>,
            dependencies: Array.from(nodeMap.get("dependencies") as Set<string>).filter(dep => dep !== id)
        }));

        const mergedEdgesArray: DependencyGraph['edges'] = Array.from(mergedEdges).map(key => {
            const [source, target] = key.split('-');
            return { source: source, target: target };
        });

        return new DependencyGraph({
            nodes: mergedNodesArray,
            edges: mergedEdgesArray
        });
    }

    /**
     * Validates the resulting graph for internal inconsistencies, primarily circular dependencies.
     * @param graph The graph to validate.
     * @returns True if the graph is valid, false otherwise.
     */
    validate(graph: DependencyGraph): boolean {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const detectCycleDFS = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) {
                return true; // Cycle detected
            }
            if (visited.has(nodeId)) {
                return false; // Already fully processed
            }

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const node = graph.nodes.find(n => n.id === nodeId);
            if (node) {
                for (const neighborId of node.dependencies) {
                    if (detectCycleDFS(neighborId)) {
                        return true;
                    }
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of graph.nodes) {
            if (!visited.has(node.id)) {
                if (detectCycleDFS(node.id)) {
                    return false; // Cycle found
                }
            }
        }

        return true;
    }
}