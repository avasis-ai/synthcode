import { describe, it, expect } from "vitest";
import { ToolExecutionDependencyGraphVisualizerV3 } from "../src/visualization/tool-execution-dependency-graph-visualizer-v3";
import { ToolInvocationRecord } from "../src/visualization/tool-invocation-record";

describe("ToolExecutionDependencyGraphVisualizerV3", () => {
    it("should correctly extract nodes and edges for a simple linear sequence", () => {
        const records: ToolInvocationRecord[] = [
            new ToolInvocationRecord("toolA", "call1"),
            new ToolInvocationRecord("toolB", "call2"),
            new ToolInvocationRecord("toolC", "call3"),
        ];
        const visualizer = new ToolExecutionDependencyGraphVisualizerV3(records);
        const { nodes, edges } = visualizer["extractToolCallSequence"](records);

        expect(nodes).toEqual(["toolA", "toolB", "toolC"]);
        expect(edges).toHaveLength(2);
        expect(edges).toEqual([
            { from: "toolA", to: "toolB" },
            { from: "toolB", to: "toolC" },
        ]);
    });

    it("should handle records with repeated tools correctly", () => {
        const records: ToolInvocationRecord[] = [
            new ToolInvocationRecord("toolA", "call1"),
            new ToolInvocationRecord("toolB", "call2"),
            new ToolInvocationRecord("toolA", "call3"),
        ];
        const visualizer = new ToolExecutionDependencyGraphVisualizerV3(records);
        const { nodes, edges } = visualizer["extractToolCallSequence"](records);

        expect(nodes).toEqual(["toolA", "toolB", "toolA"]);
        expect(edges).toHaveLength(2);
        expect(edges).toEqual([
            { from: "toolA", to: "toolB" },
            { from: "toolB", to: "toolA" },
        ]);
    });

    it("should return empty nodes and edges for an empty record list", () => {
        const records: ToolInvocationRecord[] = [];
        const visualizer = new ToolExecutionDependencyGraphVisualizerV3(records);
        const { nodes, edges } = visualizer["extractToolCallSequence"](records);

        expect(nodes).toEqual([]);
        expect(edges).toEqual([]);
    });
});