import { describe, it, expect } from "vitest";
import { ContextualToolCallValidator } from "../src/validation/contextual-tool-call-validator-v168-advanced-advanced";
import { Message } from "../src/validation/types";

describe("ContextualToolCallValidator", () => {
    it("should return isValid true for a valid tool call with no history", () => {
        const validator = new ContextualToolCallValidator([]);
        const toolCall = { tool_name: "get_weather", input: { location: "Tokyo" } };
        const context = { user_id: "user123" };
        const result = validator.validate(toolCall, context);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should return isValid false and errors for an invalid tool call name", () => {
        const history: Message[] = [
            { role: "user", content: { type: "text", text: "What is the weather like?" } }
        ];
        const validator = new ContextualToolCallValidator(history);
        const toolCall = { tool_name: "non_existent_tool", input: { location: "London" } };
        const context = { user_id: "user123" };
        const result = validator.validate(toolCall, context);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Tool name 'non_existent_tool' is not recognized.");
    });

    it("should return isValid false and errors for missing required input parameters", () => {
        const history: Message[] = [
            { role: "user", content: { type: "text", text: "Get the stock price for AAPL." } }
        ];
        const validator = new ContextualToolCallValidator(history);
        const toolCall = { tool_name: "get_stock_price", input: { symbol: undefined } };
        const context = { user_id: "user123" };
        const result = validator.validate(toolCall, context);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing required input parameter 'symbol' for tool 'get_stock_price'.");
    });
});