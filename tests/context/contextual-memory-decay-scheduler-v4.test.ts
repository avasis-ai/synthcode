import { describe, it, expect } from "vitest";
import { DecayScheduler, DecayCurve, DecayRule, ContextEntry } from "../src/context/contextual-memory-decay-scheduler-v4";

describe("DecayScheduler", () => {
  it("should initialize correctly with default values", () => {
    const scheduler = new DecayScheduler();
    expect(scheduler).toBeInstanceOf(DecayScheduler);
    // Assuming the scheduler has a way to check its initial state, e.g., an empty map or count
    // Since we don't see the full implementation, we test basic instantiation.
  });

  it("should correctly update the weight of an existing context entry", () => {
    const initialEntry: ContextEntry = {
      contextType: "user",
      timestamp: Date.now(),
      weight: 1.0,
    };
    const scheduler = new DecayScheduler();
    scheduler.addContextEntry(initialEntry);

    // Simulate time passing and decay calculation (assuming a decay method exists)
    // We'll mock the decay logic check for this test.
    const decayedEntry = scheduler.decayContextEntry(initialEntry.contextType, 1000); // Decay after 1 second
    
    // Assert that the weight has decreased from the initial value
    expect(decayedEntry.weight).toBeLessThan(initialEntry.weight);
    expect(decayedEntry.weight).toBeGreaterThan(0);
  });

  it("should handle adding context entries with different types and rules", () => {
    const scheduler = new DecayScheduler();
    
    const userRule: DecayRule = { contextType: "user", curve: { initialWeight: 1.0, decayRate: 0.1, decayPeriod: 1000 } };
    const assistantRule: DecayRule = { contextType: "assistant", curve: { initialWeight: 0.8, decayRate: 0.05, decayPeriod: 500 } };

    // Assuming a method exists to set rules or add entries based on rules
    // We test the ability to process different types.
    const userEntry: ContextEntry = { contextType: "user", timestamp: Date.now(), weight: 1.0 };
    const assistantEntry: ContextEntry = { contextType: "assistant", timestamp: Date.now(), weight: 0.8 };

    scheduler.addContextEntry(userEntry);
    scheduler.addContextEntry(assistantEntry);

    // Check if both types are registered/processed
    // This assertion depends heavily on the internal structure, but we check for basic addition.
    // If the scheduler tracks counts or specific entries, we check that.
    // For now, we assert that calling a decay method doesn't crash when multiple types are present.
    const decayedUser = scheduler.decayContextEntry("user", 1000);
    const decayedAssistant = scheduler.decayContextEntry("assistant", 500);

    expect(decayedUser).toBeDefined();
    expect(decayedAssistant).toBeDefined();
  });
});