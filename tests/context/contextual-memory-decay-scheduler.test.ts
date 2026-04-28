import { describe, it, expect } from "vitest";
import { ContextualMemoryDecayScheduler, DecayCurve } from "../src/context/contextual-memory-decay-scheduler";

describe("ContextualMemoryDecayScheduler", () => {
  it("should initialize correctly with a given store and decay curve", () => {
    const mockStore = new Map<string, any>();
    const scheduler = new ContextualMemoryDecayScheduler(mockStore, DecayCurve.Exponential);
    // We can't directly test private members, but we can test its behavior
    expect(scheduler).toBeDefined();
  });

  it("should decay the weight of an entry according to the specified curve", () => {
    const mockStore = new Map<string, any>();
    const initialWeight = 1.0;
    const entry: ContextualMemoryEntry = {
      content: [],
      timestamp: Date.now(),
      initialWeight: initialWeight,
      currentWeight: initialWeight,
    };
    mockStore.set("testKey", entry);

    const scheduler = new ContextualMemoryDecayScheduler(mockStore, DecayCurve.Linear);
    const decayFactor = 0.9;
    
    // Assuming the decay method takes a factor and updates the weight
    // We'll simulate the call that should trigger decay logic
    (scheduler as any).decay(decayFactor); 

    const updatedEntry = mockStore.get("testKey");
    expect(updatedEntry?.currentWeight).toBeCloseTo(initialWeight * decayFactor);
  });

  it("should handle decay for multiple entries in the store", () => {
    const mockStore = new Map<string, any>();
    const entry1: ContextualMemoryEntry = {
      content: [],
      timestamp: Date.now(),
      initialWeight: 1.0,
      currentWeight: 1.0,
    };
    const entry2: ContextualMemoryEntry = {
      content: [],
      timestamp: Date.now(),
      initialWeight: 1.0,
      currentWeight: 1.0,
    };
    mockStore.set("key1", entry1);
    mockStore.set("key2", entry2);

    const scheduler = new ContextualMemoryDecayScheduler(mockStore, DecayCurve.Exponential);
    const decayFactor = 0.5;

    (scheduler as any).decay(decayFactor);

    const updatedEntry1 = mockStore.get("key1");
    const updatedEntry2 = mockStore.get("key2");

    expect(updatedEntry1?.currentWeight).toBeCloseTo(1.0 * decayFactor);
    expect(updatedEntry2?.currentWeight).toBeCloseTo(1.0 * decayFactor);
  });
});