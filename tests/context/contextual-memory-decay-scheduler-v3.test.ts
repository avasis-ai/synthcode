import { describe, it, expect } from "vitest";
import { ContextualMemoryDecaySchedulerV3 } from "../src/context/contextual-memory-decay-scheduler-v3";

describe("ContextualMemoryDecaySchedulerV3", () => {
  it("should initialize correctly with a scheduler and initial context", () => {
    const scheduler = {
      getDecayFactor: (initialWeight: number, timeElapsed: number) => initialWeight * Math.exp(-0.01 * timeElapsed),
    };
    const schedulerInstance = new ContextualMemoryDecaySchedulerV3(scheduler);
    expect(schedulerInstance).toBeDefined();
  });

  it("should decay the weight of a context entry based on time elapsed", () => {
    const scheduler = {
      getDecayFactor: (initialWeight: number, timeElapsed: number) => initialWeight * Math.exp(-0.01 * timeElapsed),
    };
    const schedulerInstance = new ContextualMemoryDecaySchedulerV3(scheduler);
    const initialWeight = 1.0;
    const timeElapsed = 100;
    const decayedWeight = schedulerInstance.decayWeight(initialWeight, timeElapsed);
    expect(decayedWeight).toBeCloseTo(initialWeight * Math.exp(-0.01 * timeElapsed), 5);
  });

  it("should update the context entries with decayed weights", () => {
    const scheduler = {
      getDecayFactor: (initialWeight: number, timeElapsed: number) => initialWeight * Math.exp(-0.01 * timeElapsed),
    };
    const schedulerInstance = new ContextualMemoryDecaySchedulerV3(scheduler);
    const contextEntries: { message: any; timestamp: number; initialWeight: number; decayedWeight: number }[] = [
      { message: "msg1", timestamp: 1000, initialWeight: 1.0, decayedWeight: 1.0 },
      { message: "msg2", timestamp: 2000, initialWeight: 0.8, decayedWeight: 0.8 },
    ];
    const updatedContext = schedulerInstance.updateContext(contextEntries, 100);
    expect(updatedContext.length).toBe(2);
    expect(updatedContext[0].decayedWeight).toBeCloseTo(1.0 * Math.exp(-0.01 * 100), 5);
  });
});