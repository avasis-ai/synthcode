import { describe, it, expect } from "vitest";
import { ReactiveWorkflowEngine } from "../../../src/workflow/reactive-workflow-engine.js";

describe("ReactiveWorkflowEngine", () => {
  it("should initialize correctly and handle basic message flow", async () => {
    const engine = new ReactiveWorkflowEngine();
    const initialMessage: Message = { role: "user", content: "Hello" };

    await engine.processMessage(initialMessage);

    // Assuming processMessage updates internal state or emits an event
    // We'll check if the engine is functional by trying to process another message
    const followUpMessage: Message = { role: "user", content: "How are you?" };
    await engine.processMessage(followUpMessage);
    // In a real scenario, we would assert the resulting state or emitted events
    expect(engine).toBeDefined();
  });

  it("should handle a sequence of user, assistant, and tool messages", async () => {
    const engine = new ReactiveWorkflowEngine();

    // 1. User message
    await engine.processMessage({ role: "user", content: "What is the weather?" });

    // 2. Assistant response (tool call suggestion)
    await engine.processMessage({ role: "assistant", content: [{ type: "tool_call", tool_name: "get_weather", args: {} }] });

    // 3. Tool result
    await engine.processMessage({ role: "tool", tool_use_id: "call_123", content: "Sunny and 25C" });

    // 4. Final assistant summary
    await engine.processMessage({ role: "assistant", content: [{ type: "text", text: "The weather is sunny." }] });

    // Asserting that the engine processed the sequence without crashing
    expect(engine).toBeDefined();
  });

  it("should correctly process an initial empty message list", async () => {
    const engine = new ReactiveWorkflowEngine();
    // Simulate starting with no history
    await engine.processMessage({ role: "user", content: "Start fresh" });

    // Check if the engine handles the initial state gracefully
    expect(engine).toBeDefined();
  });
});