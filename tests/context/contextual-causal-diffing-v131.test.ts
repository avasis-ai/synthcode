import { describe, it, expect } from "vitest";
import { CausalDiffCalculator } from "../context/contextual-causal-diffing-v131";

describe("CausalDiffCalculator", () => {
  it("should correctly calculate diff when links are added", () => {
    const initialContext: AgentContext = {
      state: { a: 1 },
      causalLinks: [
        { source: "A", target: "B", weight: 0.5, type: "direct" },
      ],
    };
    const nextContext: AgentContext = {
      state: { a: 1, b: 2 },
      causalLinks: [
        { source: "A", target: "B", weight: 0.5, type: "direct" },
        { source: "B", target: "C", weight: 0.8, type: "indirect" },
      ],
    };
    const calculator = new CausalDiffCalculator();
    const diff = calculator.calculateDiff(initialContext, nextContext);

    expect(diff.addedLinks).toHaveLength(1);
    expect(diff.addedLinks[0]).toEqual({ source: "B", target: "C", weight: 0.8, type: "indirect" });
    expect(diff.removedLinks).toHaveLength(0);
    expect(diff.modifiedLinks).toHaveLength(0);
  });

  it("should correctly calculate diff when links are removed", () => {
    const initialContext: AgentContext = {
      state: { a: 1, b: 2 },
      causalLinks: [
        { source: "A", target: "B", weight: 0.5, type: "direct" },
        { source: "B", target: "C", weight: 0.8, type: "indirect" },
      ],
    };
    const nextContext: AgentContext = {
      state: { a: 1 },
      causalLinks: [
        { source: "A", target: "B", weight: 0.5, type: "direct" },
      ],
    };
    const calculator = new CausalDiffCalculator();
    const diff = calculator.calculateDiff(initialContext, nextContext);

    expect(diff.addedLinks).toHaveLength(0);
    expect(diff.removedLinks).toHaveLength(1);
    expect(diff.removedLinks[0]).toEqual({ source: "B", target: "C", weight: 0.8, type: "indirect" });
    expect(diff.modifiedLinks).toHaveLength(0);
  });

  it("should correctly calculate diff when links are modified", () => {
    const initialContext: AgentContext = {
      state: { a: 1 },
      causalLinks: [
        { source: "A", target: "B", weight: 0.5, type: "direct" },
      ],
    };
    const nextContext: AgentContext = {
      state: { a: 1 },
      causalLinks: [
        { source: "A", target: "B", weight: 0.9, type: "direct" },
      ],
    };
    const calculator = new CausalDiffCalculator();
    const diff = calculator.calculateDiff(initialContext, nextContext);

    expect(diff.addedLinks).toHaveLength(0);
    expect(diff.removedLinks).toHaveLength(0);
    expect(diff.modifiedLinks).toHaveLength(1);
    expect(diff.modifiedLinks[0]).toEqual({ source: "A", target: "B", weight: 0.9, type: "direct" });
  });
});