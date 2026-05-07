import { Graph, Node, Edge } from "./graph-types.js";

type CapabilityPayload = {
    id: string;
    type: "tool" | "constraint" | "service";
    definition: Record<string, unknown>;
};

export interface ImpactReport {
    conflicts: string[];
    prerequisites: string[];
    affectedNodes: Set<string>;
    affectedEdges: Set<string>;
    summary: string;
}

export class CapabilityImpactSimulator {
    private knowledgeGraph: Graph<Node, Edge>;
    private dependencyGraph: Graph<Node, Edge>;

    constructor(knowledgeGraph: Graph<Node, Edge>, dependencyGraph: Graph<Node, Edge>) {
        this.knowledgeGraph = knowledgeGraph;
        this.dependencyGraph = dependencyGraph;
    }

    private traverseGraph(graph: Graph<Node, Edge>, capability: CapabilityPayload): {
        affectedNodes: Set<string>;
        affectedEdges: Set<string>;
    } {
        const affectedNodes = new Set<string>();
        const affectedEdges = new Set<string>();

        // Simplified traversal: In a real scenario, this would be a complex BFS/DFS
        // checking for type compatibility or resource overlap.
        for (const nodeId of graph.nodes.keys()) {
            if (nodeId.includes(capability.id) || nodeId.includes("resource")) {
                affectedNodes.add(nodeId);
            }
        }

        for (const edgeId of graph.edges.keys()) {
            if (edgeId.includes(capability.id) || edgeId.includes("dependency")) {
                affectedEdges.add(edgeId);
            }
        }

        return { affectedNodes, affectedEdges };
    }

    public simulateImpact(capability: CapabilityPayload): ImpactReport {
        const { affectedNodes: kNodes, affectedEdges: kEdges } = this.traverseGraph(this.knowledgeGraph, capability);
        const { affectedNodes: dNodes, affectedEdges: dEdges } = this.traverseGraph(this.dependencyGraph, capability);

        const allAffectedNodes = new Set([...kNodes, ...dNodes]);
        const allAffectedEdges = new Set([...kEdges, ...dEdges]);

        const conflicts: string[] = [];
        const prerequisites: string[] = [];

        // Conflict Detection Logic
        if (capability.type === "tool" && !this.knowledgeGraph.hasNode("tool_schema_registry")) {
            conflicts.push("Missing tool schema registry linkage.");
        }

        if (capability.definition.required_resource && !this.dependencyGraph.hasEdge("resource_availability")) {
            conflicts.push("Resource requirement detected, but no resource availability dependency found.");
        }

        // Prerequisite Detection Logic
        if (capability.type === "constraint" && !this.knowledgeGraph.hasNode("core_ontology")) {
            prerequisites.push("Core Ontology knowledge base is required before applying this constraint.");
        }

        const summary = `Simulation complete. Impact detected on ${allAffectedNodes.size} nodes and ${allAffectedEdges.size} edges.`;

        return {
            conflicts: conflicts,
            prerequisites: prerequisites,
            affectedNodes: allAffectedNodes,
            affectedEdges: allAffectedEdges,
            summary: summary,
        };
    }
}