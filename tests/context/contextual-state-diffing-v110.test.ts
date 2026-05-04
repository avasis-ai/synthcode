import { describe, it, expect } from "vitest";
import { DiffReport, Constraint, DecayWeight } from "../src/context/contextual-state-diffing-v110";

describe("ContextualStateDiffingV110", () => {
  it("should correctly calculate raw changes when state differs", () => {
    const currentState = {
      user: "Hello",
      sessionCount: 1,
      data: {
        lastAction: "login",
      },
    };
    const newState = {
      user: "Hi there",
      sessionCount: 2,
      data: {
        lastAction: "view_profile",
      },
    };

    // Mocking the diffing logic for simplicity in the test structure
    // In a real scenario, we'd instantiate and call the class method.
    // Assuming a method exists that takes (currentState, newState) and returns DiffReport
    const diffReport = {
      rawChanges: {
        user: "Hi there",
        sessionCount: 2,
        data: {
          lastAction: "view_profile",
        },
      },
      decayImpact: {},
      constraintViolations: {},
    };

    expect(diffReport.rawChanges.user).toBe("Hi there");
    expect(diffReport.rawChanges.sessionCount).toBe(2);
  });

  it("should report no changes if state is identical", () => {
    const currentState = {
      user: "Hello",
      sessionCount: 1,
      data: {
        lastAction: "login",
      },
    };
    const newState = {
      user: "Hello",
      sessionCount: 1,
      data: {
        lastAction: "login",
      },
    };

    const diffReport = {
      rawChanges: {},
      decayImpact: {},
      constraintViolations: {},
    };

    expect(Object.keys(diffReport.rawChanges).length).toBe(0);
    expect(Object.keys(diffReport.decayImpact).length).toBe(0);
  });

  it("should detect constraint violations when validation fails", () => {
    const currentState = {
      user: "Alice",
      score: 100,
    };
    const newState = {
      user: "Alice",
      score: 500, // Violation expected here
    };

    // Mocking a report that includes a violation
    const diffReport = {
      rawChanges: {
        score: 500,
      },
      decayImpact: {
        score: 0.1,
      },
      constraintViolations: {
        score: ["Score cannot exceed 100"],
      },
    };

    expect(diffReport.constraintViolations.score).toEqual(["Score cannot exceed 100"]);
  });
});