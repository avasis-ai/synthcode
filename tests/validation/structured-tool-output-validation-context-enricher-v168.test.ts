import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV168,
} from "../src/validation/structured-tool-output-validation-context-enricher-v168";

describe("StructuredToolOutputValidationContextEnricherV168", () => {
  it("should correctly enrich context with resource metrics when provided", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV168();
    const mockContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "Hello" }] }],
      ],
      toolOutput: null,
      executionContext: {
        resourceMetrics: {
          cpuUsageMs: 100,
          memoryUsageBytes: 2048,
          networkBytesTransferred: 512,
        },
        temporalContext: {
          startTime: 1678886400000,
          endTime: 1678886401000,
          durationMs: 1000,
        },
      },
    };

    const enrichedContext = await enricher.enrichContext(mockContext);

    expect(enrichedContext).toHaveProperty("executionContext");
    expect(enrichedContext.executionContext.resourceMetrics.cpuUsageMs).toBe(100);
    expect(enrichedContext.executionContext.temporalContext.durationMs).toBe(1000);
  });

  it("should handle cases where execution context is missing resource metrics", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV168();
    const mockContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "Test" }] }],
      ],
      toolOutput: null,
      executionContext: {
        resourceMetrics: undefined, // Simulate missing metrics
        temporalContext: {
          startTime: 1678886400000,
          endTime: 1678886401000,
          durationMs: 1000,
        },
      },
    };

    const enrichedContext = await enricher.enrichContext(mockContext);

    expect(enrichedContext).toHaveProperty("executionContext");
    expect(enrichedContext.executionContext.resourceMetrics).toBeUndefined();
    expect(enrichedContext.executionContext.temporalContext.durationMs).toBe(1000);
  });

  it("should return the context structure even if toolOutput is null", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV168();
    const mockContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "Test" }] }],
      ],
      toolOutput: null,
      executionContext: {
        resourceMetrics: {
          cpuUsageMs: 50,
          memoryUsageBytes: 1024,
          networkBytesTransferred: 100,
        },
        temporalContext: {
          startTime: 1678886400000,
          endTime: 1678886400500,
          durationMs: 500,
        },
      },
    };

    const enrichedContext = await enricher.enrichContext(mockContext);

    expect(enrichedContext).toHaveProperty("toolOutput");
    expect(enrichedContext.toolOutput).toBeNull();
    expect(enrichedContext.messages).toHaveLength(1);
  });
});