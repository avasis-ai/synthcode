import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer";
import { DependencyGraph } from "../src/types/dependency-graph";

describe("DependencyGraphVisualizer", () => {
    it("should return a message when no graph is provided", () => {
        const visualizer = new DependencyGraphVisualizer();
        expect(visualizer.visualize(null as unknown as DependencyGraph)).toBe("No dependency graph provided.");
    });

    it("should return a message when the graph has no nodes", () => {
        const visualizer = new DependencyGraphVisualizer();
        const emptyGraph: DependencyGraph = { nodes: [], edges: [] };
        expect(visualizer.visualize(emptyGraph)).toBe("No dependency graph provided.");
    });

    it("should generate a visualization string for a simple graph", () => {
        const visualizer = new DependencyGraphVisualizer();
        const graph: DependencyGraph = {
            nodes: [
                { id: "A", name: "Module A" },
                { id: "B", name: "Module B" },
            ],
            edges: [
                { source: "A", target: "B" }
            ]
        };
        const result = visualizer.visualize(graph);
        expect(result).toContain("A -> B");
        expect(result).not.toContain("No dependency graph provided.");
    });
});