import { describe, it, expect } from "vitest";
import { ContextEnricher } from "../src/logging/structured-logging-context-enricher-v7";

describe("ContextEnricher", () => {
  it("should enrich the context with resource metrics and timestamp", () => {
    const mockContext: Record<string, unknown> = {
      user_id: "user-123",
      session_id: "session-abc",
    };
    const enricher = ContextEnricher; // Assuming ContextEnricher is the function/object to test
    const enrichedContext = enricher(mockContext)({
      // Mock message structure needed for the second call
      message: {
        content: "Test message",
        role: "user",
      },
    });

    expect(enrichedContext).toHaveProperty("timestamp");
    expect(enrichedContext).toHaveProperty("resource_metrics");
    expect(enrichedContext).toHaveProperty("context");
    expect(enrichedContext).toHaveProperty("message");
    expect(enrichedContext.context).toEqual(expect.objectContaining({
      user_id: "user-123",
      session_id: "session-abc",
    }));
  });

  it("should correctly merge existing context properties", () => {
    const mockContext: Record<string, unknown> = {
      request_type: "chat",
      source: "web",
    };
    const enricher = ContextEnricher;
    const enrichedContext = enricher(mockContext)({
      message: {
        content: "Test message",
        role: "assistant",
      },
    });

    expect(enrichedContext.context).toEqual(expect.objectContaining({
      request_type: "chat",
      source: "web",
    }));
  });

  it("should handle an empty initial context", () => {
    const mockContext: Record<string, unknown> = {};
    const enricher = ContextEnricher;
    const enrichedContext = enricher(mockContext)({
      message: {
        content: "Test message",
        role: "user",
      },
    });

    expect(enrichedContext.context).toEqual({});
  });
});