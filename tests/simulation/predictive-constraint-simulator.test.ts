import { describe, it, expect } from "vitest";
import { PredictiveConstraintSimulator, GlobalState, PlanStep } from "../src/simulation/predictive-constraint-simulator";

describe("PredictiveConstraintSimulator", () => {
  it("should initialize correctly with a given global state", () => {
    const initialState: GlobalState = {
      currentTime: 100,
      availableResources: { "CPU": 5, "Memory": 1024 },
      capabilities: new Set(["networking", "database"]),
    };
    const simulator = new PredictiveConstraintSimulator(initialState);

    expect(simulator).toBeDefined();
    expect(simulator.getState()).toEqual(initialState);
  });

  it("should simulate a simple resource request and update state", () => {
    const initialState: GlobalState = {
      currentTime: 0,
      availableResources: { "CPU": 10, "Memory": 2048 },
      capabilities: new Set(["api"]),
    };
    const simulator = new PredictiveConstraintSimulator(initialState);

    const requestStep: PlanStep = {
      type: "resource_request",
      details: { resourceName: "CPU", amount: 3 },
    };

    const nextState = simulator.simulateStep(requestStep);

    expect(nextState.availableResources["CPU"]).toBe(7);
    expect(nextState.currentTime).toBe(0); // Time should not change for resource request
  });

  it("should handle a state transition and update time", () => {
    const initialState: GlobalState = {
      currentTime: 50,
      availableResources: { "CPU": 10, "Memory": 2048 },
      capabilities: new Set(["api"]),
    };
    const simulator = new PredictiveConstraintSimulator(initialState);

    const transitionStep: PlanStep = {
      type: "state_transition",
      details: { newState: "Processing", duration: 5 },
    };

    const nextState = simulator.simulateStep(transitionStep);

    expect(nextState.currentTime).toBe(55);
    expect(nextState.availableResources).toEqual({ "CPU": 10, "Memory": 2048 }); // Resources should remain unchanged
  });
});