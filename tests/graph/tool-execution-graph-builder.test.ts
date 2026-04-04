import { describe, it, expect } from "vitest";
import { GraphBuilder } from "../src/graph/tool-execution-graph-builder";

describe("GraphBuilder", () => {
    it("should build a simple linear graph correctly", () => {
        const builder = new GraphBuilder();
        builder.addStep("toolA", () => ({}));
        builder.addStep("toolB", () => ({}));
        builder.addConnection("toolA", "toolB");

        const graph = builder.buildGraph();
        expect(graph.steps).toHaveLength(2);
        expect(graph.connections).toEqual(expect.arrayContaining([
            { from: "toolA", to: "toolB" }
        ]));
    });

    it("should handle multiple connections between the same nodes", () => {
        const builder = new GraphBuilder();
        builder.addStep("toolA", () => ({}));
        builder.addStep("toolB", () => ({}));
        builder.addConnection("toolA", "toolB");
        builder.addConnection("toolA", "toolB");

        const graph = builder.buildGraph();
        expect(graph.connections).toHaveLength(2);
    });

    it("should correctly build a graph with branching paths", () => {
        const builder = new GraphBuilder();
        builder.addStep("start", () => ({}));
        builder.addStep("toolA", () => ({}));
        builder.addStep("toolB", () => ({}));
        builder.addConnection("start", "toolA");
        builder.addConnection("start", "toolB");

        const graph = builder.buildGraph();
        expect(graph.steps).toHaveLength(3);
        expect(graph.connections).toHaveLength(2);
    });
});