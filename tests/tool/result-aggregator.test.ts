import { describe, it, expect } from "vitest";
import { ToolResultAggregator } from "../src/tool/result-aggregator";
import { ToolResultMessage } from "../src/tool/types";

describe("ToolResultAggregator", () => {
    it("should group results correctly by tool_use_id", () => {
        const result1: ToolResultMessage = { tool_use_id: "toolA", content: "result1" };
        const result2: ToolResultMessage = { tool_use_id: "toolB", content: "result2" };
        const result3: ToolResultMessage = { tool_use_id: "toolA", content: "result3" };

        const aggregator = new ToolResultAggregator([result1, result2, result3]);
        const grouped = aggregator["groupResultsByTool"]([result1, result2, result3]);

        expect(grouped.size).toBe(2);
        expect(grouped.get("toolA")!).toHaveLength(2);
        expect(grouped.get("toolB")!).toHaveLength(1);
    });

    it("should handle an empty array of results", () => {
        const aggregator = new ToolResultAggregator([]);
        const grouped = aggregator["groupResultsByTool"]([]);

        expect(grouped.size).toBe(0);
    });

    it("should return the original array if only one tool is used", () => {
        const result1: ToolResultMessage = { tool_use_id: "toolX", content: "single_result" };
        const aggregator = new ToolResultAggregator([result1]);
        const grouped = aggregator["groupResultsByTool"]([result1]);

        expect(grouped.size).toBe(1);
        expect(grouped.get("toolX")!).toHaveLength(1);
    });
});