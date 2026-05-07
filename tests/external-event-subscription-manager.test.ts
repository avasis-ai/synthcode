import { describe, it, expect, vi } from "vitest";
import { ExternalEventSubscriptionManager } from "../src/external-event-subscription-manager";

describe("ExternalEventSubscriptionManager", () => {
  it("should initialize and correctly subscribe to an event", async () => {
    const manager = new ExternalEventSubscriptionManager();
    const mockHandler = vi.fn();

    // Assuming a method exists to subscribe, e.g., subscribeToEvent
    await manager.subscribeToEvent("user_message", mockHandler);

    // Simulate the event being emitted
    await manager.emitEvent("user_message", { role: "user", content: "Hello" });

    // Check if the handler was called with the correct data
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith({ role: "user", content: "Hello" });
  });

  it("should handle multiple event subscriptions for the same event type", async () => {
    const manager = new ExternalEventSubscriptionManager();
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();

    await manager.subscribeToEvent("tool_result", mockHandler1);
    await manager.subscribeToEvent("tool_result", mockHandler2);

    const eventData = { role: "tool", tool_use_id: "t1", content: "Success" };
    await manager.emitEvent("tool_result", eventData);

    // Check if both handlers were called
    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
    expect(mockHandler1).toHaveBeenCalledWith(eventData);
    expect(mockHandler2).toHaveBeenCalledWith(eventData);
  });

  it("should unsubscribe a specific event handler", async () => {
    const manager = new ExternalEventSubscriptionManager();
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();

    await manager.subscribeToEvent("user_message", mockHandler1);
    await manager.subscribeToEvent("user_message", mockHandler2);

    // Assuming an unsubscribe method exists, e.g., unsubscribeFromEvent
    await manager.unsubscribeFromEvent("user_message", mockHandler1);

    const eventData = { role: "user", content: "Test message" };
    await manager.emitEvent("user_message", eventData);

    // Check if only the second handler was called
    expect(mockHandler1).toHaveBeenCalledTimes(0);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledWith(eventData);
  });
});