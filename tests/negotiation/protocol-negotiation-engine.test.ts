import { describe, it, expect } from "vitest";
import { ProtocolNegotiationEngine } from "../src/negotiation/protocol-negotiation-engine";

describe("ProtocolNegotiationEngine", () => {
  it("should initialize correctly with a valid message history", () => {
    const history = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: [] },
    ];
    const engine = new ProtocolNegotiationEngine(history);
    expect(engine).toBeDefined();
  });

  it("should handle negotiation when the last message is a user prompt", async () => {
    const history = [
      { role: "user", content: "What is the capital of France?" },
    ];
    const engine = new ProtocolNegotiationEngine(history);
    const result = await engine.negotiate();
    expect(result).toEqual({
      needs_tool_call: false,
      next_message: { role: "assistant", content: [] },
    });
  });

  it("should detect the need for tool use when the last message implies a tool call", async () => {
    const history = [
      { role: "user", content: "Get the current weather in London." },
    ];
    // Assuming the engine logic detects the need for a tool call based on content
    const engine = new ProtocolNegotiationEngine(history);
    const result = await engine.negotiate();
    expect(result).toEqual({
      needs_tool_call: true,
      next_message: { role: "tool", tool_use_id: "some-id", content: "Weather data" },
    });
  });
});