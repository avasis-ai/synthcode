import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV135Service } from "../src/context/contextual-state-diffing-v135";

describe("ContextualStateDiffingV135Service", () => {
  it("should calculate a basic diff and score when state changes significantly", () => {
    const service = new ContextualStateDiffingV135Service({
      initialConstraint: {
        timeDecayFactor: 0.1,
        memoryUsageThreshold: 100,
        cpuLoadFactor: 0.5,
      },
    });

    const oldState = {
      messages: [{ type: "text", content: "Hello" }],
      userContext: { userId: "user123", lastAction: "login" },
    };
    const newState = {
      messages: [{ type: "text", content: "Hello" }, { type: "text", content: "How are you?" }],
      userContext: { userId: "user123", lastAction: "send_message" },
    };

    const diffResult = service.calculateDiff(oldState, newState);

    expect(diffResult).toBeDefined();
    expect(diffResult?.diff).toHaveProperty("messages");
    expect(diffResult?.temporalScore).toBeGreaterThan(0);
    expect(diffResult?.resourceImpact).toEqual({ memory: expect.any(Number), cpu: expect.any(Number) });
  });

  it("should return minimal diff and score when state is nearly identical", () => {
    const service = new ContextualStateDiffingV135Service({
      initialConstraint: {
        timeDecayFactor: 0.1,
        memoryUsageThreshold: 100,
        cpuLoadFactor: 0.5,
      },
    });

    const state = {
      messages: [{ type: "text", content: "Stable message" }],
      userContext: { userId: "user123", lastAction: "view_page" },
    };

    const diffResult = service.calculateDiff(state, state);

    expect(diffResult).toBeDefined();
    expect(diffResult?.diff).toEqual({});
    expect(diffResult?.temporalScore).toBeCloseTo(0, 5);
  });

  it("should adjust resource impact based on constraints when state changes", () => {
    const service = new ContextualStateDiffingV135Service({
      initialConstraint: {
        timeDecayFactor: 0.5,
        memoryUsageThreshold: 50,
        cpuLoadFactor: 0.9,
      },
    });

    const oldState = {
      messages: [],
      userContext: { userId: "user123", lastAction: "initial" },
    };
    const newState = {
      messages: [{ type: "text", content: "Large context addition" }],
      userContext: { userId: "user123", lastAction: "complex_interaction" },
    };

    const diffResult = service.calculateDiff(oldState, newState);

    expect(diffResult).toBeDefined();
    // Check if resource impact reflects the change and constraints
    expect(diffResult?.resourceImpact).toEqual({ memory: expect.any(Number), cpu: expect.any(Number) });
    // A more specific check might require knowing the exact calculation, but we verify it's non-zero for a change.
    expect(diffResult?.resourceImpact).not.toEqual({ memory: 0, cpu: 0 });
  });
});