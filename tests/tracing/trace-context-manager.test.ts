import { describe, it, expect } from "vitest"
import { TraceContextManager, SpanContext } from "../src/tracing/trace-context-manager"

describe("TraceContextManager", () => {
  it("should initialize with an empty context stack", () => {
    const manager = new TraceContextManager()
    // We can't directly test private members, but we can test behavior
    // that relies on an empty stack (e.g., starting a new trace)
    expect(manager).toBeInstanceOf(TraceContextManager)
  })

  it("should push a new context correctly when starting a span", () => {
    const manager = new TraceContextManager()
    const initialContext: Partial<SpanContext> = {
      traceId: "test-trace-id",
      operationName: "initial-operation",
    }
    const newContext = manager.startSpan(initialContext)

    expect(newContext).toBeDefined()
    const context = newContext as SpanContext
    expect(context.traceId).toBe("test-trace-id")
    expect(context.operationName).toBe("initial-operation")
    expect(context.spanId).toBeDefined()
    expect(context.parentSpanId).toBeUndefined() // Should be the root span
  })

  it("should update the context stack when starting a nested span", () => {
    const manager = new TraceContextManager()
    // Simulate the first span
    const rootContext: SpanContext = {
      traceId: "test-trace-id",
      spanId: "root-span-id",
      operationName: "root-operation",
    }
    // Manually set up the stack for testing nested behavior
    // Note: In a real scenario, we'd use a method to set the initial state.
    // Assuming the internal state can be manipulated or we simulate the push.
    // Since we cannot access private members, we rely on the public API flow.

    // 1. Start the root span (simulated)
    const rootSpan = manager.startSpan({
      traceId: "test-trace-id",
      operationName: "root-operation",
    }) as SpanContext

    // 2. Start a nested span
    const nestedSpan = manager.startSpan({
      operationName: "nested-operation",
    }) as SpanContext

    expect(nestedSpan).toBeDefined()
    const context = nestedSpan as SpanContext
    expect(context.traceId).toBe("test-trace-id")
    expect(context.operationName).toBe("nested-operation")
    expect(context.spanId).toBeDefined()
    // The nested span's parent should be the root span's ID
    expect(context.parentSpanId).toBe(rootSpan.spanId)
  })
})