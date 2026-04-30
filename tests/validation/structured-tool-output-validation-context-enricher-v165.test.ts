import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputContextEnricherV165,
  ValidationContext,
  TemporalResourceContext,
  EnrichedValidationContext,
} from "../src/validation/structured-tool-output-validation-context-enricher-v165";

describe("StructuredToolOutputContextEnricherV165", () => {
  it("should enrich the context with temporal and resource information", () => {
    const mockValidationContext: ValidationContext = {
      messages: [
        { role: "user", content: "Test user message" } as any,
      ],
      metadata: {
        sessionId: "test-session",
        source: "api",
      },
    };
    const mockTemporalContext: TemporalResourceContext = {
      startTime: 1672531200000,
      endTime: 1672534800000,
      resourceUsage: {
        cpuMs: 1200,
        memoryBytes: 512 * 1024,
      },
    };

    const enricher = new StructuredToolOutputContextEnricherV165();
    const enrichedContext = enricher.enrich(mockValidationContext, mockTemporalContext);

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext).toHaveProperty("temporalContext");
    expect(enrichedContext.temporalContext).toEqual(mockTemporalContext);
    expect(enrichedContext.messages).toEqual(mockValidationContext.messages);
    expect(enrichedContext.metadata).toEqual(mockValidationContext.metadata);
  });

  it("should handle empty message history correctly", () => {
    const mockValidationContext: ValidationContext = {
      messages: [],
      metadata: {
        sessionId: "empty-session",
      },
    };
    const mockTemporalContext: TemporalResourceContext = {
      startTime: 0,
      endTime: 1000,
      resourceUsage: {
        cpuMs: 0,
        memoryBytes: 0,
      },
    };

    const enricher = new StructuredToolOutputContextEnricherV165();
    const enrichedContext = enricher.enrich(mockValidationContext, mockTemporalContext);

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.messages).toEqual([]);
    expect(enrichedContext.metadata).toEqual({
      sessionId: "empty-session",
    });
    expect(enrichedContext.temporalContext).toEqual(mockTemporalContext);
  });

  it("should correctly merge existing metadata with new context data", () => {
    const mockValidationContext: ValidationContext = {
      messages: [
        { role: "assistant", content: "Initial response" } as any,
      ],
      metadata: {
        user: "testuser",
        source: "web",
      },
    };
    const mockTemporalContext: TemporalResourceContext = {
      startTime: 1672531200000,
      endTime: 1672534800000,
      resourceUsage: {
        cpuMs: 500,
        memoryBytes: 256 * 1024,
      },
    };

    const enricher = new StructuredToolOutputContextEnricherV165();
    const enrichedContext = enricher.enrich(mockValidationContext, mockTemporalContext);

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext.metadata).toEqual({
      user: "testuser",
      source: "web",
    });
    expect(enrichedContext.temporalContext).toEqual(mockTemporalContext);
  });
});