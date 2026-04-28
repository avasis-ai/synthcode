import { describe, it, expect } from "vitest";
import { UnifiedDependencyGraphVisualizer } from "../src/visualization/unified-dependency-graph-visualizer";
import { GraphPayload } from "../src/visualization/graph-payload";

describe("UnifiedDependencyGraphVisualizer", () => {
    it("should return an empty string if there are no nodes", () => {
        const payload: GraphPayload = {
            nodes: [],
            edges: [],
            metadata: {}
        };
        const visualizer = new UnifiedDependencyGraphVisualizer(payload);
        expect(visualizer.renderToSVG()).toBe("");
    });

    it("should generate basic SVG structure when nodes and edges are present", () => {
        const payload: GraphPayload = {
            nodes: [{ id: "A", label: "Node A" }],
            edges: [{ source: "A", target: "B" }],
            metadata: { title: "Test Graph" }
        };
        const visualizer = new UnifiedDependencyGraphVisualizer(payload);
        const svg = visualizer.renderToSVG();
        expect(svg).toContain("<svg width=\"100\" height=\"100\">");
        expect(svg).toContain("Node A");
    });

    it("should handle missing metadata gracefully", () => {
        const payload: GraphPayload = {
            nodes: [{ id: "A", label: "Node A" }],
            edges: [],
            metadata: undefined as any // Simulate missing metadata
        };
        const visualizer = new UnifiedDependencyGraphVisualizer(payload);
        const svg = visualizer.renderToSVG();
        expect(svg).toContain("Node A");
        // Check that it doesn't crash and produces some output
        expect(svg).not.toBe("");
    });
});