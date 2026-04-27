import { describe, it, expect } from "vitest";
import { StructuredLoggingContextEnricher } from "../src/logging/structured-logging-context-enricher-v2";

describe("StructuredLoggingContextEnricher", () => {
  it("should initialize with default context values", () => {
    const enricher = new StructuredLoggingContextEnricher();
    expect(enricher.getContext()).toEqual({
      sessionId: "",
      activeToolCallId: undefined,
      currentStep: undefined,
      resourceUsage: {
        tokenUsageDelta: 0,
        costEstimateCents: 0,
      },
      metadata: {},
    });
  });

  it("should correctly update context with session ID and metadata", () => {
    const enricher = new StructuredLoggingContextEnricher();
    const newSessionId = "test-session-123";
    const newMetadata = { source: "api", version: "2.0" };
    enricher.setSessionId(newSessionId);
    enricher.setMetadata(newMetadata);

    const context = enricher.getContext();
    expect(context.sessionId).toBe(newSessionId);
    expect(context.metadata).toEqual(newMetadata);
  });

  it("should correctly update resource usage metrics", () => {
    const enricher = new StructuredLoggingContextEnricher();
    const initialUsage = { tokenUsageDelta: 100, costEstimateCents: 5 };
    enricher.setResourceUsage(initialUsage);

    const updatedUsage = { tokenUsageDelta: 50, costEstimateCents: 2 };
    enricher.updateResourceUsage(updatedUsage);

    const context = enricher.getContext();
    expect(context.resourceUsage.tokenUsageDelta).toBe(150);
    expect(context.resourceUsage.costEstimateCents).toBe(7);
  });
});