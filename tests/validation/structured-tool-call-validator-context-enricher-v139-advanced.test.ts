import { describe, it, expect } from "vitest";
import { ContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v139-advanced";

describe("ContextEnricher", () => {
  it("should enrich context when no specific path is provided", () => {
    const context = {
      messages: [
        { type: "user", content: "Hello" } as any,
      ],
      path: undefined,
    };
    const enriched = ContextEnricher(context);
    expect(enriched.enrichedContext).toEqual(context);
  });

  it("should enrich context when a simple execution path is provided", () => {
    const context = {
      messages: [
        { type: "user", content: "What is the weather?" } as any,
      ],
      path: {
        requiredPrecedingCalls: [],
        expectedSequence: [{ toolName: "getWeather", order: 1 }],
      },
    };
    const enriched = ContextEnricher(context);
    expect(enriched.enrichedContext.path).toBeDefined();
    expect(enriched.enrichedContext.path?.expectedSequence).toEqual([
      { toolName: "getWeather", order: 1 },
    ]);
  });

  it("should correctly process context with multiple required preceding calls", () => {
    const context = {
      messages: [
        { type: "user", content: "First step" } as any,
      ],
      path: {
        requiredPrecedingCalls: [
          { toolName: "toolA", minCount: 1 },
          { toolName: "toolB", minCount: 2 },
        ],
        expectedSequence: [],
      },
    };
    const enriched = ContextEnricher(context);
    expect(enriched.enrichedContext.path?.requiredPrecedingCalls).toEqual([
      { toolName: "toolA", minCount: 1 },
      { toolName: "toolB", minCount: 2 },
    ]);
  });
});