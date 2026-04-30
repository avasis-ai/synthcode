import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV163 } from "../src/validation/structured-tool-output-validation-context-enricher-v163";
import { ValidationContext, ExecutionHistory, ToolUsageContext } from "../src/validation/context-enricher-types";

describe("StructuredToolOutputValidationContextEnricherV163", () => {
    it("should enrich the context with metadata from the original context", () => {
        const enricher = new StructuredToolOutputValidationContextEnricherV163();
        const mockContext: ValidationContext = {
            id: "test-id",
            metadata: { source: "test" },
            // Add other required fields if necessary for a complete mock
        };
        const mockHistory: ExecutionHistory = {};
        const mockToolContext: ToolUsageContext = {};

        const enrichedContext = enricher.enrich(mockContext, mockHistory, mockToolContext);

        expect(enrichedContext.id).toBe(mockContext.id);
        expect(enrichedContext.metadata).toEqual({ source: "test" });
    });

    it("should correctly merge metadata when the original context has no metadata", () => {
        const enricher = new StructuredToolOutputValidationContextEnricherV163();
        const mockContext: ValidationContext = {
            id: "test-id-no-meta",
            metadata: {},
        };
        const mockHistory: ExecutionHistory = {};
        const mockToolContext: ToolUsageContext = {};

        const enrichedContext = enricher.enrich(mockContext, mockHistory, mockToolContext);

        expect(enrichedContext.id).toBe(mockContext.id);
        expect(enrichedContext.metadata).toEqual({});
    });

    it("should return a new context object instance", () => {
        const enricher = new StructuredToolOutputValidationContextEnricherV163();
        const mockContext: ValidationContext = {
            id: "test-id-immutability",
            metadata: { initial: true },
        };
        const mockHistory: ExecutionHistory = {};
        const mockToolContext: ToolUsageContext = {};

        const enrichedContext = enricher.enrich(mockContext, mockHistory, mockToolContext);

        expect(enrichedContext).not.toBe(mockContext);
    });
});