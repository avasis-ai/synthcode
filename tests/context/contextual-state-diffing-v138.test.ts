import { describe, it, expect } from "vitest";
import {
  Constraint,
  TemporalResourceConstraint,
} from "../context/contextual-state-diffing-v138";

describe("ContextualStateDiffing", () => {
  it("should correctly validate a simple state transition with a constraint", () => {
    const resourceConstraint: TemporalResourceConstraint = {
      type: "resource",
      resourceName: "counter",
      initialValue: 0,
      validate: (currentState, proposedState, diff) => {
        const currentCount = currentState.resources?.counter || 0;
        const proposedCount = proposedState.resources?.counter || 0;
        if (proposedCount > currentCount + 1) {
          return { isValid: false, reason: "Cannot increment by more than 1." };
        }
        return { isValid: true };
      },
    };

    const currentState = { resources: { counter: 5 } };
    const proposedState = { resources: { counter: 6 } };
    const diff = { resources: { counter: 6 } };

    const result = resourceConstraint.validate(currentState, proposedState, diff);
    expect(result.isValid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("should fail validation when the state transition violates the resource constraint", () => {
    const resourceConstraint: TemporalResourceConstraint = {
      type: "resource",
      resourceName: "counter",
      initialValue: 10,
      validate: (currentState, proposedState, diff) => {
        const currentCount = currentState.resources?.counter || 0;
        const proposedCount = proposedState.resources?.counter || 0;
        if (proposedCount > currentCount + 1) {
          return { isValid: false, reason: "Cannot increment by more than 1." };
        }
        return { isValid: true };
      },
    };

    const currentState = { resources: { counter: 10 } };
    const proposedState = { resources: { counter: 13 } };
    const diff = { resources: { counter: 13 } };

    const result = resourceConstraint.validate(currentState, proposedState, diff);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Cannot increment by more than 1.");
  });

  it("should pass validation when the state transition is within the allowed bounds", () => {
    const resourceConstraint: TemporalResourceConstraint = {
      type: "resource",
      resourceName: "counter",
      initialValue: 5,
      validate: (currentState, proposedState, diff) => {
        const currentCount = currentState.resources?.counter || 0;
        const proposedCount = proposedState.resources?.counter || 0;
        if (proposedCount > currentCount + 1) {
          return { isValid: false, reason: "Cannot increment by more than 1." };
        }
        return { isValid: true };
      },
    };

    const currentState = { resources: { counter: 5 } };
    const proposedState = { resources: { counter: 6 } };
    const diff = { resources: { counter: 6 } };

    const result = resourceConstraint.validate(currentState, proposedState, diff);
    expect(result.isValid).toBe(true);
  });
});