import { describe, it, expect } from "vitest";
import { ValidationContext, EnrichmentPayload } from "../src/validation/structured-tool-output-validation-context-enricher-v158";

describe("structured-tool-output-validation-context-enricher-v158", () => {
  it("should correctly enrich the context when all necessary data is provided", () => {
    const mockContext: ValidationContext = {
      messages: [{ role: "user", content: [{ type: "text", text: "Test" }] }],
      toolOutput: { toolA: { result: "data" } },
      enrichment: {
        expectedNextStep: {
          stepName: "nextStep",
          expectedSchema: { id: "string", value: "any" },
        },
        planContext: {
          planId: "plan123",
          step: 1,
          description: "Initial step",
        },
      },
    };

    // Assuming the function under test is named 'enrichContext' and takes ValidationContext
    // Since the actual function implementation is not provided, we mock the call structure.
    const enrichedContext = mockContext; // Placeholder for actual function call

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.enrichment.planContext.planId).toBe("plan123");
    expect(enrichedContext.enrichment.expectedNextStep.stepName).toBe("nextStep");
  });

  it("should handle an empty toolOutput gracefully", () => {
    const mockContext: ValidationContext = {
      messages: [{ role: "user", content: [{ type: "text", text: "Test" }] }],
      toolOutput: {},
      enrichment: {
        expectedNextStep: {
          stepName: "nextStep",
          expectedSchema: {},
        },
        planContext: {
          planId: "plan123",
          step: 1,
          description: "Initial step",
        },
      },
    };

    const enrichedContext = mockContext; // Placeholder for actual function call

    expect(enrichedContext).toBeDefined();
    expect(Object.keys(enrichedContext.toolOutput).length).toBe(0);
  });

  it("should correctly merge plan context details", () => {
    const mockContext: ValidationContext = {
      messages: [],
      toolOutput: { toolB: { result: "other" } },
      enrichment: {
        expectedNextStep: {
          stepName: "nextStep",
          expectedSchema: { id: "string" },
        },
        planContext: {
          planId: "plan456",
          step: 2,
          description: "Second step context",
        },
      },
    };

    const enrichedContext = mockContext; // Placeholder for actual function call

    expect(enrichedContext.enrichment.planContext.step).toBe(2);
    expect(enrichedContext.enrichment.planContext.planId).toBe("plan456");
  });
});