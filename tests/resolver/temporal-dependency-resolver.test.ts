import { describe, it, expect } from "vitest";
import {
    TemporalDependencyResolver,
    TemporalDependencyEdge,
    DependencyGraph,
} from "../src/resolver/temporal-dependency-resolver.js";

describe("TemporalDependencyResolver", () => {
    it("should correctly resolve a simple linear dependency graph", () => {
        const graph: DependencyGraph = {
            nodes: ["A", "B", "C"],
            edges: [
                { source: "A", target: "B" },
                { source: "B", target: "C" },
            ],
        };

        const resolver = new TemporalDependencyResolver();
        const result = resolver.resolve(graph);

        expect(result).toEqual([
            { source: "A", target: "B", requiredTimeWindow: [0, 1000], resourceRequirement: { resourceId: "res1", requiredCapacity: 1 } },
            { source: "B", target: "C", requiredTimeWindow: [1000, 2000], resourceRequirement: { resourceId: "res2", requiredCapacity: 2 } },
        ]);
    });

    it("should handle disconnected nodes and multiple paths correctly", () => {
        const graph: DependencyGraph = {
            nodes: ["A", "B", "C", "D"],
            edges: [
                { source: "A", target: "B" },
                { source: "A", target: "C" },
                { source: "B", target: "D" },
            ],
        };

        const resolver = new TemporalDependencyResolver();
        const result = resolver.resolve(graph);

        // Expecting the resolver to process edges sequentially or based on a defined order
        // For this test, we assume the resolver processes all edges and assigns dummy constraints
        expect(result.length).toBe(3);
        // Check if all edges are present and have valid structure
        expect(result).toContainEqual(expect.objectContaining({ source: "A", target: "B" }));
        expect(result).toContainEqual(expect.objectContaining({ source: "A", target: "C" }));
        expect(result).toContainEqual(expect.objectContaining({ source: "B", target: "D" }));
    });

    it("should return an empty array for an empty graph", () => {
        const graph: DependencyGraph = {
            nodes: [],
            edges: [],
        };

        const resolver = new TemporalDependencyResolver();
        const result = resolver.resolve(graph);

        expect(result).toEqual([]);
    });
});