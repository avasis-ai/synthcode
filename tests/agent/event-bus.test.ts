import { describe, it, expect, vi } from "vitest";
import { AgentEventBus } from "../src/agent/event-bus";

describe("AgentEventBus", () => {
  it("should allow subscribing and publishing events correctly", async () => {
    const eventBus = new AgentEventBus();
    const eventName = "testEvent";
    const mockHandler = vi.fn();

    const unsubscribe = eventBus.subscribe(eventName, mockHandler);

    const testEvent = { data: "test" };
    await eventBus.publish(eventName, testEvent);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(testEvent);

    unsubscribe();
    await eventBus.publish(eventName, testEvent); // Should not be called again
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple subscribers for the same event", async () => {
    const eventBus = new AgentEventBus();
    const eventName = "multiTestEvent";
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();

    eventBus.subscribe(eventName, mockHandler1);
    eventBus.subscribe(eventName, mockHandler2);

    const testEvent = { id: 1 };
    await eventBus.publish(eventName, testEvent);

    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(mockHandler1).toHaveBeenCalledWith(testEvent);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledWith(testEvent);
  });

  it("should not call handlers for non-existent events", async () => {
    const eventBus = new AgentEventBus();
    const mockHandler = vi.fn();

    eventBus.subscribe("existingEvent", mockHandler);

    await eventBus.publish("nonExistentEvent", { data: "should not trigger" });

    expect(mockHandler).not.toHaveBeenCalled();
  });
});