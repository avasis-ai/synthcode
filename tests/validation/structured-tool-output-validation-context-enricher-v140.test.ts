import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV140,
} from "../src/validation/structured-tool-output-validation-context-enricher-v140";

describe("StructuredToolOutputValidationContextEnricherV140", () => {
  it("should correctly enrich context with resource metrics and temporal constraints", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV140();
    const baseContext = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is the capital of France?" }],
          },
        },
      ],
      schema: {
        tool_name: "get_capital",
        parameters: {
          country: { type: "string" },
        },
      },
    };
    const resourceMetrics = {
      cpuUsageMs: 150,
      memoryUsageBytes: 1024 * 1024,
      networkBytesTransferred: 5000,
    };
    const temporalConstraints = {
      startTime: 1678886400000,
      elapsedTimeMs: 500,
      timeoutMs: 2000,
    };

    const enrichedContext = await enricher.enrichContext(
      baseContext,
      resourceMetrics,
      temporalConstraints
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.resourceMetrics).toEqual(resourceMetrics);
    expect(enrichedContext?.temporalConstraints).toEqual(temporalConstraints);
    expect(enrichedContext?.baseContext).toEqual(baseContext);
  });

  it("should handle empty or default values for metrics and constraints", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV140();
    const baseContext = {
      messages: [],
      schema: {},
    };
    const resourceMetrics = {
      cpuUsageMs: 0,
      memoryUsageBytes: 0,
      networkBytesTransferred: 0,
    };
    const temporalConstraints = {
      startTime: 0,
      elapsedTimeMs: 0,
      timeoutMs: 0,
    };

    const enrichedContext = await enricher.enrichContext(
      baseContext,
      resourceMetrics,
      temporalConstraints
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.resourceMetrics).toEqual(resourceMetrics);
    expect(enrichedContext?.temporalConstraints).toEqual(temporalConstraints);
  });

  it("should correctly merge and validate the context structure", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV140();
    const baseContext = {
      messages: [{ role: "user", content: [] }],
      schema: { tool_name: "test" },
    };
    const resourceMetrics = {
      cpuUsageMs: 50,
      memoryUsageBytes: 5000,
      networkBytesTransferred: 100,
    };
    const temporalConstraints = {
      startTime: 1000,
      elapsedTimeMs: 100,
      timeoutMs: 500,
    };

    const enrichedContext = await enricher.enrichContext(
      baseContext,
      resourceMetrics,
      temporalConstraints
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.baseContext).toEqual(baseContext);
    expect(enrichedContext?.resourceMetrics).toEqual(resourceMetrics);
    expect(enrichedContext?.temporalConstraints).toEqual(temporalConstraints);
  });
});