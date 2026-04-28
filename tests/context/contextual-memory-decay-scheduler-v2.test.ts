import { describe, it, expect, vi } from "vitest";
import { ContextualMemoryDecaySchedulerV2 } from "../src/context/contextual-memory-decay-scheduler-v2";

describe("ContextualMemoryDecaySchedulerV2", () => {
  it("should initialize correctly with default decay curve", () => {
    const scheduler = new ContextualMemoryDecaySchedulerV2();
    expect(scheduler).toBeDefined();
    expect(typeof (scheduler as any).decayCurve).toBe("object");
  });

  it("should correctly decay memory based on usage count for exponential curve", () => {
    const scheduler = new ContextualMemoryDecaySchedulerV2({
      decayCurve: { type: "exponential", parameters: { rate: 0.1 } },
    });
    const initialValue = 100;
    const usageCount = 5;
    const decayedValue = scheduler.calculateDecay(initialValue, usageCount);
    // Simple check to ensure decay happens (value decreases)
    expect(decayedValue).toBeLessThan(initialValue);
  });

  it("should handle different decay curve types (e.g., linear)", () => {
    const scheduler = new ContextualMemoryDecaySchedulerV2({
      decayCurve: { type: "linear", parameters: { rate: 0.05 } },
    });
    const initialValue = 100;
    const usageCount = 10;
    const decayedValue = scheduler.calculateDecay(initialValue, usageCount);
    // Check if the decay calculation logic is triggered for a different type
    expect(decayedValue).toBeCloseTo(initialValue * (1 - 0.05 * usageCount));
  });
});