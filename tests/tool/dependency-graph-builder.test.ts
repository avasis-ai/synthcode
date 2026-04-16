import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/tool/dependency-graph-builder";
import { ToolExecutionRecord } from "../src/tool/types";

describe("DependencyGraph", () => {
    it("should correctly build a graph from a set of records", () => {
        const records: ToolExecutionRecord[] = [
            { toolId: "A", inputs: ["file1"], outputs: ["file2"] },
            { toolId: "B", inputs: ["file2"], outputs: ["file3"] },
            { toolId: "C", inputs: ["file1"], outputs: ["file4"] },
        ];
        const graph = new DependencyGraph(records);

        // Check if nodes A, B, and C exist
        expect(graph.getNode("A")).toBeDefined();
        expect(graph.getNode("B")).toBeDefined();
        expect(graph.getNode("C")).toBeDefined();

        // Check dependencies (A -> B)
        const nodeB = graph.getNode("B")!;
        expect(nodeB.inputs.has("file2")).toBe(true);
        expect(nodeB.outputs.size).toBe(1);
    });

    it("should handle records with no dependencies", () => {
        const records: ToolExecutionRecord[] = [
            { toolId: "D", inputs: [], outputs: ["file5"] },
            { toolId: "E", inputs: [], outputs: [] },
        ];
        const graph = new DependencyGraph(records);

        // Check nodes D and E exist
        expect(graph.getNode("D")).toBeDefined();
        expect(graph.getNode("E")).toBeDefined();

        // Check inputs/outputs for D and E
        const nodeD = graph.getNode("D")!;
        expect(nodeD.inputs.size).toBe(0);
        expect(nodeD.outputs.has("file5")).toBe(true);

        const nodeE = graph.getNode("E")!;
        expect(nodeE.inputs.size).toBe(0);
        expect(nodeE.outputs.size).toBe(0);
    });

    it("should correctly aggregate multiple inputs/outputs for the same tool", () => {
        const records: ToolExecutionRecord[] = [
            { toolId: "F", inputs: ["file1"], outputs: ["file2"] },
            { toolId: "F", inputs: ["file3"], outputs: ["file4"] },
        ];
        const graph = new DependencyGraph(records);

        const nodeF = graph.getNode("F")!;
        expect(nodeF.inputs.has("file1")).toBe(true);
        expect(nodeF.inputs.has("file3")).toBe(true);
        expect(nodeF.outputs.has("file2")).toBe(true);
        expect(nodeF.outputs.has("file4")).toBe(true);
    });
});