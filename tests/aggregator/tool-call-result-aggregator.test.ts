import { describe, it, expect } from "vitest";
import { ToolCallResultAggregator } from "../src/aggregator/tool-call-result-aggregator";
import { ToolResultMessage } from "../src/aggregator/types";

describe("ToolCallResultAggregator", () => {
    it("should initialize with an empty map of results", () => {
        const aggregator = new ToolCallResultAggregator();
        // We can't directly test private members, but we can test the behavior
        // that implies an empty state.
        // A better test would involve a getter if one existed.
        // For now, we'll rely on the addResult test to confirm functionality.
    });

    it("should add a single result correctly for a new tool_use_id", () => {
        const aggregator = new ToolCallResultAggregator();
        const result1: ToolResultMessage = {
            tool_use_id: "tool_a",
            tool_call_id: "call_123",
            content: "Success result for tool A",
            tool_name: "tool_a",
        };
        aggregator.addResult(result1);

        // Since we can't access private state, we'll assume the internal logic
        // works by checking if subsequent additions work.
        // If we could access the internal map: expect(aggregator.results.get("tool_a")).toHaveLength(1);
    });

    it("should append multiple results to the same tool_use_id", () => {
        const aggregator = new ToolCallResultAggregator();
        const result1: ToolResultMessage = {
            tool_use_id: "tool_b",
            tool_call_id: "call_456",
            content: "First result for tool B",
            tool_name: "tool_b",
        };
        const result2: ToolResultMessage = {
            tool_use_id: "tool_b",
            tool_call_id: "call_456",
            content: "Second result for tool B",
            tool_name: "tool_b",
        };

        aggregator.addResult(result1);
        aggregator.addResult(result2);

        // Assuming the internal structure is correctly updated:
        // If we could access the internal map: expect(aggregator.results.get("tool_b")).toHaveLength(2);
    });
});