import { describe, it, expect } from "vitest";
import { StructuredLoggingContextEnricher, ContextData } from "../src/logging/structured-logging-context-enricher";
import { Logger } from "../src/logging/logger";

describe("StructuredLoggingContextEnricher", () => {
  it("should enrich the log message with context data when context is provided", () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;
    const mockContextProvider: () => ContextData = () => ({
      traceId: "test-trace-id",
      sessionId: "test-session-id",
      userId: "test-user-id",
    });
    const enricher = new StructuredLoggingContextEnricher(mockLogger, mockContextProvider);

    const logMessage = { message: "User logged in" };
    const enriched = enricher.enrich(logMessage, {});

    expect(enriched).toHaveProperty("context");
    expect(enriched.context).toEqual({
      traceId: "test-trace-id",
      sessionId: "test-session-id",
      userId: "test-user-id",
    });
    expect(enriched.message).toBe(logMessage.message);
  });

  it("should handle missing context data gracefully", () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;
    const mockContextProvider: () => ContextData = () => ({});
    const enricher = new StructuredLoggingContextEnricher(mockLogger, mockContextProvider);

    const logMessage = { message: "Some event occurred" };
    const enriched = enricher.enrich(logMessage, {});

    expect(enriched).toHaveProperty("context");
    expect(enriched.context).toEqual({});
    expect(enriched.message).toBe(logMessage.message);
  });

  it("should merge additional context keys", () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;
    const mockContextProvider: () => ContextData = () => ({
      traceId: "trace-123",
    });
    const enricher = new StructuredLoggingContextEnricher(mockLogger, mockContextProvider);

    const logMessage = { message: "Processing step" };
    const additionalContext: ContextData = {
      step: "payment_processing",
      requestId: "req-456",
    };
    const enriched = enricher.enrich(logMessage, additionalContext);

    expect(enriched).toHaveProperty("context");
    expect(enriched.context).toEqual({
      traceId: "trace-123",
      step: "payment_processing",
      requestId: "req-456",
    });
  });
});