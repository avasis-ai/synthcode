import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidationGuardrail } from "../src/guardrails/tool-output-schema-validation-guardrail";
import { ToolResultMessage } from "../src/guardrails/types";

describe("ToolOutputSchemaValidationGuardrail", () => {
    it("should return isValid: true and empty errors when the tool output matches the schema", () => {
        const mockValidator: (data: unknown) => { isValid: boolean; errors: string[] } = (data) => ({ isValid: true, errors: [] });
        const mockSchema: Record<string, any> = { name: "test", type: "string" };
        const guardrail = new ToolOutputSchemaValidationGuardrail(mockValidator, mockSchema);
        const validOutput: ToolResultMessage = { toolName: "testTool", output: { name: "value", type: "string" } };

        const result = guardrail.validate(validOutput);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should return isValid: false and errors when the tool output does not match the schema", () => {
        const mockValidator: (data: unknown) => { isValid: boolean; errors: string[] } = (data) => ({ isValid: false, errors: ["Missing required field 'name'"] });
        const mockSchema: Record<string, any> = { name: "test", type: "string" };
        const guardrail = new ToolOutputSchemaValidationGuardrail(mockValidator, mockSchema);
        const invalidOutput: ToolResultMessage = { toolName: "testTool", output: { type: "string" } };

        const result = guardrail.validate(invalidOutput);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(["Missing required field 'name'"]);
    });

    it("should correctly use the provided validator and schema during validation", () => {
        const mockValidator: (data: unknown) => { isValid: boolean; errors: string[] } = vi.fn((data) => ({ isValid: true, errors: [] }));
        const mockSchema: Record<string, any> = { id: 123 };
        const guardrail = new ToolOutputSchemaValidationGuardrail(mockValidator, mockSchema);
        const toolOutput: ToolResultMessage = { toolName: "testTool", output: { id: 123 } };

        guardrail.validate(toolOutput);

        expect(mockValidator).toHaveBeenCalledWith(toolOutput.output);
    });
});