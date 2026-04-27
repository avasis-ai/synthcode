import { describe, it, expect } from "vitest";
import { DependencyGraphMerger } from "../src/tool/dependency-graph-merger.js";
import { DependencyGraph } from "../src/tool/dependency-graph.js";

describe("DependencyGraphMerger", () => {
    it("should merge multiple graphs correctly when nodes and edges are unique", () => {
        const graph1 = new DependencyGraph([
            { id: "A", dependencies: ["B"] }
        ]);
        const graph2 = new DependencyGraph([
            { id: "C", dependencies: ["D"] }
        ]);

        const merger = new DependencyGraphMerger([graph1, graph2]);
        const mergedGraph = merger.merge();

        expect(mergedGraph.nodes.length).toBe(2);
        expect(mergedGraph.edges.size).toBe(2);
    });

    it("should correctly merge overlapping nodes and combine dependencies", () => {
        const graph1 = new DependencyGraph([
            { id: "A", dependencies: ["B"] },
            { id: "B", dependencies: ["C"] }
        ]);
        const graph2 = new DependencyGraph([
            { id: "B", dependencies: ["D"] }, // Overlapping node B
            { id: "E", dependencies: [] }
        ]);

        const merger = new DependencyGraphMerger([graph1, graph2]);
        const mergedGraph = merger.merge();

        // Check node count (A, B, C, D, E)
        expect(mergedGraph.nodes.length).toBe(4);
        
        // Check dependencies for node B (should contain C and D)
        const nodeB = mergedGraph.nodes.find(n => n.id === "B");
        expect(nodeB).toBeDefined();
        expect(nodeB.dependencies).toHaveLength(2);
    });

    it("should handle merging of empty graphs", () => {
        const graph1 = new DependencyGraph([]);
        const graph2 = new DependencyGraph([]);

        const merger = new DependencyGraphMerger([graph1, graph2]);
        const mergedGraph = merger.merge();

        expect(mergedGraph.nodes.length).toBe(0);
        expect(mergedGraph.edges.size).toBe(0);
    });
});