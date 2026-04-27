import { describe, it, expect } from "vitest";
import { StructuredLoggingContext } from "../src/logging/structured-logging-context";

describe("StructuredLoggingContext", () => {
  it("should initialize with default values if no context is provided", () => {
    const context = new StructuredLoggingContext();
    const getContext = (c: StructuredLoggingContext) => (c as any).getContext();
    expect(getContext(context).traceId).toBe("unknown-trace");
    expect(getContext(context).sessionId).toBe("unknown-session");
  });

  it("should correctly initialize with provided traceId and sessionId", () => {
    const context = new StructuredLoggingContext({
      traceId: "test-trace-id",
      sessionId: "test-session-id",
    });
    const getContext = (c: StructuredLoggingContext) => (c as any).getContext();
    expect(getContext(context).traceId).toBe("test-trace-id");
    expect(getContext(context).sessionId).toBe("test-session-id");
  });

  it("should merge additional properties into the context", () => {
    const customContext = {
      traceId: "specific-trace",
      sessionId: "specific-session",
      userId: "user-123",
      environment: "test",
    };
    const context = new StructuredLoggingContext(customContext);
    const getContext = (c: StructuredLoggingContext) => (c as any).getContext();
    const contextData = getContext(context);

    expect(contextData.traceId).toBe("specific-trace");
    expect(contextData.sessionId).toBe("specific-session");
    expect(contextData.userId).toBe("user-123");
    expect(contextData.environment).toBe("test");
  });
});