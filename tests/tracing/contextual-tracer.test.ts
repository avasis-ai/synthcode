import { describe, it, expect, vi } from "vitest";
import { ContextualTracer } from "../src/tracing/contextual-tracer";

describe("ContextualTracer", () => {
  it("should initialize with a valid context", () => {
    const tracer = new ContextualTracer("trace-123", "span-abc");
    // Assuming a getter or internal check is possible, or we test behavior
    // Since the class structure is not fully provided, we test the core functionality
    // based on the expected usage pattern.
    expect(tracer).toBeInstanceOf(ContextualTracer);
  });

  it("should correctly start a new span within the current context", () => {
    const tracer = new ContextualTracer("trace-123", "span-abc");
    const newSpan = tracer.startSpan("new-operation");

    expect(newSpan).toBeDefined();
    // Assuming startSpan returns a Span object or a context manager
    // We check if the returned span reflects the correct trace ID and parent context.
    // Since we don't have the full implementation, we mock the expected structure.
    const span = newSpan as any;
    expect(span.traceId).toBe("trace-123");
    expect(span.attributes.parentSpanId).toBe("span-abc");
    expect(span.operationName).toBe("new-operation");
  });

  it("should update the context span ID when a new span is started", () => {
    const tracer = new ContextualTracer("trace-123", "span-abc");
    // Simulate starting a span and updating the internal context
    tracer.startSpan("another-operation");

    // We assume the internal state (context) is updated
    // If the class has a method to get the current context, we test that.
    // Since we don't have it, we rely on the side effect of startSpan.
    // If startSpan updates the context, subsequent calls should reflect it.
    // For this test, we assume the context is updated to the new span ID.
    const newContext = (tracer as any).getContext();
    expect(newContext.currentSpanId).not.toBe("span-abc");
    expect(newContext.currentSpanId).toBe("new-span-id"); // Assuming the new ID is generated
  });
});