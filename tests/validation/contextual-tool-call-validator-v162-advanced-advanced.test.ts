import { describe, it, expect } from "vitest";
import { ContextualToolCallValidator } from "../src/validation/contextual-tool-call-validator-v162-advanced-advanced";

describe("ContextualToolCallValidator", () => {
    it("should validate a simple tool call with correct context", () => {
        const initialContext: Record<string, any> = { userId: "user123" };
        const validator = new ContextualToolCallValidator(initialContext);

        const toolCall = {
            id: "call1",
            name: "get_user_profile",
            input: { userId: "user123" },
        };

        const result = validator.validateToolCall(toolCall, { context: initialContext, history: [] });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.finalState).toEqual(initialContext);
    });

    it("should fail validation if required input parameters are missing", () => {
        const initialContext: Record<string, any> = { requiredParam: "value" };
        const validator = new ContextualToolCallValidator(initialContext);

        const toolCall = {
            id: "call2",
            name: "process_data",
            input: { otherParam: "value" }, // Missing requiredParam
        };

        const result = validator.validateToolCall(toolCall, { context: initialContext, history: [] });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing required parameter: requiredParam");
    });

    it("should update context state correctly after successful validation", () => {
        const initialContext: Record<string, any> = { initialCount: 10 };
        const validator = new ContextualToolCallValidator(initialContext);

        const toolCall = {
            id: "call3",
            name: "increment_counter",
            input: { amount: 5 },
        };

        const result = validator.validateToolCall(toolCall, { context: initialContext, history: [] });

        expect(result.isValid).toBe(true);
        expect(result.finalState).toEqual({ initialCount: 10, lastToolCallId: "call3" });
    });
});