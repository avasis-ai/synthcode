import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v142";
import { ValidationContext, ExecutionContext } from "../src/validation/validation-context-types";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should enrich context with resource usage when provided", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: ValidationContext = {
      // Minimal context for testing
      toolOutput: "some output",
    };
    const mockExecution: ExecutionContext = {
      // Minimal execution context
    };
    const payload = {
      resourceUsage: {
        cpuMs: 100,
        memoryBytes: 2048,
        networkBytes: 512,
      },
    };

    const result = enricher.enrich(mockContext, mockExecution, payload);

    expect(result.context.resourceUsage).toEqual(payload.resourceUsage);
  });

  it("should enrich context with temporal constraints when provided", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: ValidationContext = {
      // Minimal context for testing
      toolOutput: "some output",
    };
    const mockExecution: ExecutionContext = {
      // Minimal execution context
    };
    const payload = {
      temporalConstraint: {
        startTime: 1672531200000,
        endTime: 1672534800000,
        maxDurationMs: 1800000,
      },
    };

    const result = enricher.enrich(mockContext, mockExecution, payload);

    expect(result.context.temporalConstraint).toEqual(payload.temporalConstraint);
  });

  it("should handle missing enrichment payload gracefully", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: ValidationContext = {
      // Minimal context for testing
      toolOutput: "some output",
    };
    const mockExecution: ExecutionContext = {
      // Minimal execution context
    };
    const payload: any = undefined; // Test with undefined payload

    const result = enricher.enrich(mockContext, mockExecution, payload);

    // Expect the context to be returned without adding the enrichment fields if payload is missing
    expect(result.context).toEqual(mockContext);
  });
});