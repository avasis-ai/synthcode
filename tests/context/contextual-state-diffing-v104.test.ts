import { describe, it, expect } from "vitest";
import { CausalDiffCalculator, StateDiff } from "../src/context/contextual-state-diffing-v104";

describe("CausalDiffCalculator", () => {
  it("should calculate a meaningful diff when state changes significantly", () => {
    const calculator = new CausalDiffCalculator();
    const previousState = { userQuery: "Hello", context: { count: 1 } };
    const currentState = { userQuery: "Hi there", context: { count: 2 } };

    calculator.setPreviousState(previousState);
    calculator.setCurrentState(currentState);

    const diff: StateDiff = calculator.calculateDiff();

    expect(diff.isMeaningful).toBe(true);
    expect(diff.reason).toContain("significant change");
    expect(diff.diffDetails).toEqual({
      userQuery: "Hi there",
      context: { count: 2 },
    });
  });

  it("should report no meaningful diff when state remains unchanged", () => {
    const calculator = new CausalDiffCalculator();
    const state = { userQuery: "Test", context: { count: 5 } };

    calculator.setPreviousState(state);
    calculator.setCurrentState(state);

    const diff: StateDiff = calculator.calculateDiff();

    expect(diff.isMeaningful).toBe(false);
    expect(diff.reason).toContain("no significant change");
    expect(diff.diffDetails).toEqual({});
  });

  it("should handle diffing when only a specific nested property changes", () => {
    const calculator = new CausalDiffCalculator();
    const previousState = { data: { items: [{ id: 1, value: "A" }] }, metadata: "old" };
    const currentState = { data: { items: [{ id: 1, value: "A" }, { id: 2, value: "B" }] }, metadata: "new" };

    calculator.setPreviousState(previousState);
    calculator.setCurrentState(currentState);

    const diff: StateDiff = calculator.calculateDiff();

    expect(diff.isMeaningful).toBe(true);
    expect(diff.reason).toContain("change detected");
    expect(diff.diffDetails).toHaveProperty("data");
    expect(diff.diffDetails.data.items).toHaveLength(2);
  });
});