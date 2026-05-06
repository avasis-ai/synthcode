import { describe, it, expect, vi } from "vitest";
import { AgentEventBus } from "../src/event/agent-event-bus.js";

describe("AgentEventBus", () => {
  it("should initialize and allow event publishing", () => {
    const eventBus = new AgentEventBus();
    const mockHandler = vi.fn();
    eventBus.on("user_message", mockHandler);
    eventBus.emit("user_message", { role: "user", content: "Test" });
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith({ role: "user", content: "Test" });
  });

  it("should allow multiple listeners for the same event", () => {
    const eventBus = new AgentEventBus();
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();
    eventBus.on("tool_result", mockHandler1);
    eventBus.on("tool_result", mockHandler2);
    const testPayload = { tool_use_id: "test", content: "result" };
    eventBus.emit("tool_result", testPayload);
    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
  });

  it("should handle event emission with no listeners gracefully", () => {
    const eventBus = new AgentEventBus();
    // This test ensures that emitting an event without any listeners does not throw an error.
    expect(() => {
      eventBus.emit("non_existent_event", "payload");
    }).not.toThrow();
  });
});