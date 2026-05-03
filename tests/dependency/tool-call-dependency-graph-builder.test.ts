import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphBuilder } from "../src/dependency/tool-call-dependency-graph-builder.js";
import { ToolCall } from "../src/dependency/tool-call.js";

describe("ToolCallDependencyGraphBuilder", () => {
    it("should initialize with provided tool calls and an empty graph", () => {
        const call1 = new ToolCall("call1");
        const call2 = new ToolCall("call2");
        const builder = new ToolCallDependencyGraphBuilder([call1, call2]);

        expect(builder.getCalls()).toHaveLength(2);
        // Check if the adjacency list has entries for both calls
        expect(builder.getAdjacencyList().has(call1)).toBe(true);
        expect(builder.getAdjacencyList().has(call2)).toBe(true);
    });

    it("should correctly add a dependency between two tool calls", () => {
        const callA = new ToolCall("callA");
        const callB = new ToolCall("callB");
        const builder = new ToolCallDependencyGraphBuilder([callA, callB]);

        builder.addDependency(callA, callB);

        const adjacencyList = builder.getAdjacencyList();
        expect(adjacencyList.get(callA)?.has(callB)).toBe(true);
        expect(adjacencyList.get(callB)?.has(callA)).toBe(false); // Should only depend on A
    });

    it("should handle adding multiple dependencies correctly", () => {
        const callA = new ToolCall("callA");
        const callB = new ToolCall("callB");
        const callC = new ToolCall("callC");
        const builder = new ToolCallDependencyGraphBuilder([callA, callB, callC]);

        builder.addDependency(callA, callB);
        builder.addDependency(callA, callC);

        const adjacencyList = builder.getAdjacencyList();
        expect(adjacencyList.get(callA)?.has(callB)).toBe(true);
        expect(adjacencyList.get(callA)?.has(callC)).toBe(true);
        expect(adjacencyList.get(callA)).toHaveSize(2);
    });
});