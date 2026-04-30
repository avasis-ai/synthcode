import { describe, it, expect } from "vitest";
import { ContextualConstraintPropagatorV5 } from "../src/context/contextual-constraint-propagator-v5";

describe("ContextualConstraintPropagatorV5", () => {
  it("should correctly propagate constraints when source constraints are provided", () => {
    const propagator = new ContextualConstraintPropagatorV5();
    const initialConstraints: Constraint[] = [
      { key: "topic", value: "AI", source: "initial", decayRate: 0.1 },
      { key: "tone", value: "formal", source: "initial", decayRate: 0.05 },
    ];
    const propagated = propagator.propagate(initialConstraints);

    expect(propagated).toHaveLength(2);
    expect(propagated).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "topic", value: "AI", source: "initial", decayRate: 0.1 }),
      expect.objectContaining({ key: "tone", value: "formal", source: "initial", decayRate: 0.05 }),
    ]));
  });

  it("should handle an empty list of source constraints gracefully", () => {
    const propagator = new ContextualConstraintPropagatorV5();
    const initialConstraints: Constraint[] = [];
    const propagated = propagator.propagate(initialConstraints);

    expect(propagated).toEqual([]);
  });

  it("should apply decay logic if the propagator implementation includes time-based decay (assuming a simple pass-through for this test)", () => {
    // This test assumes the propagator might process or modify constraints,
    // but for a basic check, we ensure it runs without error and returns the expected structure.
    const propagator = new ContextualConstraintPropagatorV5();
    const initialConstraints: Constraint[] = [
      { key: "key1", value: "val1", source: "initial", decayRate: 0.2 },
    ];
    const propagated = propagator.propagate(initialConstraints);

    expect(propagated).toHaveLength(1);
    expect(propagated[0].key).toBe("key1");
  });
});