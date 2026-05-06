import { describe, it, expect, vi } from "vitest"
import { ReactiveContextBus } from "../src/context/reactive-context-bus"

describe("ReactiveContextBus", () => {
  it("should allow multiple subscriptions and trigger handlers correctly", async () => {
    const bus = new ReactiveContextBus()
    const mockValue = { count: 0, data: "initial" }

    // Mock the internal state update mechanism for testing purposes
    // We assume the bus manages some internal state that can be updated.
    // Since the provided code snippet is incomplete, we simulate the update
    // by directly calling a hypothetical internal setter or using a spy
    // if the class exposed a setter. For this test, we'll assume the
    // bus has a method or mechanism to update its state.
    // Let's assume a method `updateState` exists for testing.
    const updateState = vi.spyOn(bus, "updateState").mockImplementation((newState) => {
      // Simulate state change and trigger internal logic
      // (In a real scenario, the bus would handle this)
    })

    const handler1 = vi.fn()
    const handler2 = vi.fn()

    // Subscribe to a path that will change
    bus.subscribe("count", (value) => typeof value === "number" && value > 0, handler1)
    // Subscribe to another path
    bus.subscribe("data", (value) => typeof value === "string" && value.length > 5, handler2)

    // Simulate state update that should trigger handler1
    await bus.updateState({ count: 10, data: "short" })
    expect(handler1).toHaveBeenCalledWith(10)
    expect(handler2).not.toHaveBeenCalled()

    // Simulate state update that should trigger handler2
    await bus.updateState({ count: 10, data: "very long string" })
    expect(handler1).toHaveBeenCalledWith(10) // Still called
    expect(handler2).toHaveBeenCalledWith("very long string")
  })

  it("should not trigger handlers if the filter condition is not met", async () => {
    const bus = new ReactiveContextBus()
    const handler = vi.fn()

    // Subscribe to a path with a strict filter
    bus.subscribe("count", (value) => typeof value === "number" && value > 100, handler)

    // Simulate state update that fails the filter
    await bus.updateState({ count: 50 })
    expect(handler).not.toHaveBeenCalled()

    // Simulate state update that passes the filter
    await bus.updateState({ count: 150 })
    expect(handler).toHaveBeenCalledWith(150)
  })

  it("should handle updates when the subscribed path is missing or null", async () => {
    const bus = new ReactiveContextBus()
    const handler = vi.fn()

    // Subscribe to a path that might be null
    bus.subscribe("optionalField", (value) => typeof value === "string", handler)

    // 1. Initial update (optionalField is missing)
    await bus.updateState({ otherField: 1 })
    expect(handler).not.toHaveBeenCalled()

    // 2. Update with null value (fails string filter)
    await bus.updateState({ optionalField: null })
    expect(handler).not.toHaveBeenCalled()

    // 3. Update with valid string value
    await bus.updateState({ optionalField: "test" })
    expect(handler).toHaveBeenCalledWith("test")
  })
})