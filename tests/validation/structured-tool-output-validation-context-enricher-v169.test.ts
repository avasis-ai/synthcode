import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV169 } from "../src/validation/structured-tool-output-validation-context-enricher-v169";
import { Context, ToolResultMessage } from "../src/validation/base-context-enricher";

describe("StructuredToolOutputValidationContextEnricherV169", () => {
    it("should enrich context with metadata based on tool output", () => {
        const mockExpectedNextStep = { stepName: "nextStep", requiredInputs: { input1: "value1" } };
        const enricher = new StructuredToolOutputValidationContextEnricherV169(mockExpectedNextStep);

        const mockContext: Context = {
            history: [{ role: "user", content: "initial message" }],
            metadata: { initial: true }
        };

        const mockToolOutput: ToolResultMessage = {
            toolName: "someTool",
            output: JSON.stringify({ result: "success", data: "test_data" })
        };

        const enrichedContext = enricher.enrich(mockContext, mockToolOutput);

        expect(enrichedContext.metadata).toBeDefined();
        expect(enrichedContext.metadata).toEqual(expect.objectContaining({
            tool_output_metadata: {
                toolName: "someTool",
                output: { result: "success", data: "test_data" }
            }
        }));
        expect(enrichedContext.history).toEqual(mockContext.history); // Ensure other parts are preserved
    });

    it("should handle empty tool output gracefully", () => {
        const mockExpectedNextStep = { stepName: "nextStep", requiredInputs: {} };
        const enricher = new StructuredToolOutputValidationContextEnricherV169(mockExpectedNextStep);

        const mockContext: Context = {
            history: [],
            metadata: {}
        };

        const mockToolOutput: ToolResultMessage = {
            toolName: "emptyTool",
            output: "{}"
        };

        const enrichedContext = enricher.enrich(mockContext, mockToolOutput);

        expect(enrichedContext.metadata).toBeDefined();
        expect(enrichedContext.metadata).toEqual(expect.objectContaining({
            tool_output_metadata: {
                toolName: "emptyTool",
                output: {}
            }
        }));
    });

    it("should correctly merge context metadata with tool output metadata", () => {
        const mockExpectedNextStep = { stepName: "nextStep", requiredInputs: { input1: "value1" } };
        const enricher = new StructuredToolOutputValidationContextEnricherV169(mockExpectedNextStep);

        const mockContext: Context = {
            history: [],
            metadata: { existingKey: "oldValue" }
        };

        const mockToolOutput: ToolResultMessage = {
            toolName: "mergeTool",
            output: JSON.stringify({ result: "merged" })
        };

        const enrichedContext = enricher.enrich(mockContext, mockToolOutput);

        expect(enrichedContext.metadata).toBeDefined();
        expect(enrichedContext.metadata).toEqual(expect.objectContaining({
            existingKey: "oldValue",
            tool_output_metadata: {
                toolName: "mergeTool",
                output: { result: "merged" }
            }
        }));
    });
});