import { describe, it, expect } from "vitest";
import { ContextualMemoryDecaySchedulerV6 } from "../src/context/contextual-memory-decay-scheduler-v6";

describe("ContextualMemoryDecaySchedulerV6", () => {
  it("should initialize correctly with provided decay rules", () => {
    const decayRules: any = {
      user: { curve: (age) => 1 - age / 100, initialWeight: 1.0 },
      assistant: { curve: (age) => 1 - Math.pow(age / 100, 2), initialWeight: 1.0 },
      tool: { curve: (age) => 0.5, initialWeight: 0.8 },
    };
    const scheduler = new ContextualMemoryDecaySchedulerV6(decayRules);
    expect(scheduler).toBeInstanceOf(ContextualMemoryDecaySchedulerV6);
  });

  it("should correctly calculate the weight of a new entry", () => {
    const decayRules: any = {
      user: { curve: (age) => 1, initialWeight: 1.0 },
      assistant: { curve: (age) => 1, initialWeight: 1.0 },
      tool: { curve: (age) => 1, initialWeight: 1.0 },
    };
    const scheduler = new ContextualMemoryDecaySchedulerV6(decayRules);
    const message = { /* minimal message structure */ } as any;
    const entry = { message: message, timestamp: Date.now(), type: "user" };
    const newWeight = scheduler.calculateWeight(entry.type, entry.timestamp, Date.now());
    expect(newWeight).toBeCloseTo(1.0);
  });

  it("should decay the weight of an old entry based on its type", () => {
    const decayRules: any = {
      user: { curve: (age) => 1 - age / 100, initialWeight: 1.0 },
      assistant: { curve: (age) => 1 - Math.pow(age / 100, 2), initialWeight: 1.0 },
      tool: { curve: (age) => 0.5, initialWeight: 0.8 },
    };
    const scheduler = new ContextualMemoryDecaySchedulerV6(decayRules);
    const oldTimestamp = Date.now() - 100; // 100 seconds ago
    const message = { /* minimal message structure */ } as any;
    const entry = { message: message, timestamp: oldTimestamp, type: "user" };

    // For user type, decay should be 1 - 100/100 = 0
    const decayedWeight = scheduler.calculateWeight(entry.type, entry.timestamp, Date.now());
    expect(decayedWeight).toBeCloseTo(0.0);
  });
});