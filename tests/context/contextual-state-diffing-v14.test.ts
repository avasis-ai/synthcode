import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV14 } from "../src/context/contextual-state-diffing-v14";

describe("ContextualStateDiffingV14", () => {
  it("should correctly identify a simple state change", () => {
    const diffing = new ContextualStateDiffingV14();
    const previousState = { user: "Alice", count: 10 };
    const currentState = { user: "Alice", count: 12 };
    diffing.setPreviousState(previousState);
    diffing.setCurrentState(currentState);

    const diffs = diffing.diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe("count");
    expect(diffs[0].oldValue).toBe(10);
    expect(diffs[0].newValue).toBe(12);
    expect(diffs[0].isCausallyExplained).toBe(false); // Assuming no context provided for explanation
    expect(diffs[0].isDrift).toBe(false); // Assuming no drift detection logic is triggered by default
  });

  it("should detect multiple changes and correctly mark them", () => {
    const diffing = new ContextualStateDiffingV14();
    const previousState = { a: 1, b: "old", c: true };
    const currentState = { a: 1, b: "new", c: false };
    diffing.setPreviousState(previousState);
    diffing.setCurrentState(currentState);

    const diffs = diffing.diff();

    expect(diffs).toHaveLength(2);
    const paths = diffs.map(d => d.path).sort();
    expect(paths).toEqual(["b", "c"]);

    // Check specific changes
    const bDiff = diffs.find(d => d.path === "b");
    expect(bDiff?.oldValue).toBe("old");
    expect(bDiff?.newValue).toBe("new");

    const cDiff = diffs.find(d => d.path === "c");
    expect(cDiff?.oldValue).toBe(true);
    expect(cDiff?.newValue).toBe(false);
  });

  it("should return an empty array when the state has not changed", () => {
    const diffing = new ContextualStateDiffingV14();
    const state = { data: [1, 2, 3], status: "ok" };
    diffing.setPreviousState(state);
    diffing.setCurrentState(state);

    const diffs = diffing.diff();

    expect(diffs).toHaveLength(0);
  });
});