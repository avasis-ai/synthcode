import { describe, it, expect } from "vitest";
import { AdvancedContext, ContextEnricher } from "../src/validation/structured-tool-input-validation-context-enricher-v160-advanced-advanced";

describe("ContextEnricher", () => {
  it("should enrich context with basic dependencies and temporal data", () => {
    const enricher: ContextEnricher = {
      enrichContext: (context) => {
        // Mock implementation for testing
        const enrichedContext: AdvancedContext = {
          dependencies: {
            user: "test_user",
            sessionId: "test_session",
          },
          temporal: {
            lastInteractionTime: Date.now() - 10000,
            timeSinceLastEventMs: 10000,
          },
        };
        return { enrichedContext };
      },
    };

    const mockContext = {
      messages: [{ role: "user", content: "Hello" }],
      currentToolUse: null,
    };

    const { enrichedContext } = enricher.enrichContext(mockContext);

    expect(enrichedContext.dependencies).toBeDefined();
    expect(enrichedContext.temporal).toBeDefined();
    expect(enrichedContext.dependencies.user).toBe("test_user");
    expect(enrichedContext.temporal.timeSinceLastEventMs).toBe(10000);
  });

  it("should handle context when a tool use is present", () => {
    const enricher: ContextEnricher = {
      enrichContext: (context) => {
        // Mock implementation for testing
        const enrichedContext: AdvancedContext = {
          dependencies: {
            toolCallId: "tool_xyz",
          },
          temporal: {
            lastInteractionTime: Date.now(),
            timeSinceLastEventMs: 0,
          },
        };
        return { enrichedContext };
      },
    };

    const mockContext = {
      messages: [{ role: "assistant", content: "Calling tool" }],
      currentToolUse: { toolName: "someTool", toolCallId: "tool_xyz" },
    };

    const { enrichedContext } = enricher.enrichContext(mockContext);

    expect(enrichedContext.dependencies.toolCallId).toBe("tool_xyz");
    expect(enrichedContext.temporal.timeSinceLastEventMs).toBe(0);
  });

  it("should return a correctly structured enriched context", () => {
    const enricher: ContextEnricher = {
      enrichContext: (context) => {
        // Mock implementation for testing
        const enrichedContext: AdvancedContext = {
          dependencies: {
            source: "mock",
          },
          temporal: {
            lastInteractionTime: 1678886400000,
            timeSinceLastEventMs: 5000,
          },
        };
        return { enrichedContext };
      },
    };

    const mockContext = {
      messages: [],
      currentToolUse: null,
    };

    const { enrichedContext } = enricher.enrichContext(mockContext);

    expect(enrichedContext).toEqual({
      dependencies: {
        source: "mock",
      },
      temporal: {
        lastInteractionTime: 1678886400000,
        timeSinceLastEventMs: 5000,
      },
    });
  });
});