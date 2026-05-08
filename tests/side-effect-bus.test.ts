import { describe, it, expect, vi } from "vitest";
import { SideEffectBus } from "../src/side-effect-bus";

describe("SideEffectBus", () => {
  it("should correctly dispatch and handle side effects", async () => {
    const bus = new SideEffectBus();
    const mockHandler = vi.fn();

    // Subscribe a handler
    bus.on("user_action", mockHandler);

    // Dispatch an event
    await bus.emit("user_action", { action: "click", target: "button" });

    // Check if the handler was called with the correct arguments
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith({ action: "click", target: "button" });
  });

  it("should allow multiple handlers for the same event", async () => {
    const bus = new SideEffectBus();
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();

    // Subscribe multiple handlers
    bus.on("data_update", mockHandler1);
    bus.on("data_update", mockHandler2);

    // Dispatch the event
    await bus.emit("data_update", "New data payload");

    // Check if both handlers were called
    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
    expect(mockHandler1).toHaveBeenCalledWith("New data payload");
    expect(mockHandler2).toHaveBeenCalledWith("New data payload");
  });

  it("should handle event emission when no listeners are attached", async () => {
    const bus = new SideEffectBus();
    const mockHandler = vi.fn();

    // Ensure no listeners are attached initially
    // (We don't explicitly call on, so the bus should remain clean)

    // Emit an event
    await bus.emit("non_existent_event", "Some payload");

    // Verify that no side effects (mock calls) occurred
    expect(mockHandler).not.toHaveBeenCalled();
  });
});