import { describe, it, expect } from "vitest";
import {
  ContextualStateDiffingV19,
  ContextGraph,
  SemanticDiffReport,
} from "../src/context/contextual-state-diffing-v19";

describe("ContextualStateDiffingV19", () => {
  it("should correctly calculate diffs for simple state changes", () => {
    const initialState: Record<string, any> = {
      user: "Alice",
      settings: { theme: "dark", notifications: true },
      history: [{ role: "user", content: "Hello" }],
    };
    const newState: Record<string, any> = {
      user: "Alice",
      settings: { theme: "dark", notifications: false },
      history: [{ role: "user", content: "Hello" }],
    };

    const graph: ContextGraph = {
      user: { relatedFields: ["settings"], semanticWeight: 0.5 },
      settings: { relatedFields: ["user"], semanticWeight: 0.3 },
    };

    const report: SemanticDiffReport = ContextualStateDiffingV19(
      initialState, newState, graph
    );

    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].path).toBe("settings.notifications");
    expect(report.diffs[0].oldValue).toBe(true);
    expect(report.diffs[0].newValue).toBe(false);
    expect(report.diffs[0].isSemanticDrift).toBe(false);
  });

  it("should detect semantic drift when a related field changes significantly", () => {
    const initialState: Record<string, any> = {
      user: "Alice",
      context: { topic: "coding", complexity: 2 },
    };
    const newState: Record<string, any> = {
      user: "Alice",
      context: { topic: "gardening", complexity: 1 },
    };

    const graph: ContextGraph = {
      user: { relatedFields: ["context"], semanticWeight: 0.5 },
      context: { relatedFields: ["user"], semanticWeight: 0.5 },
    };

    const report: SemanticDiffReport = ContextualStateDiffingV19(
      initialState, newState, graph
    );

    // Expecting the topic change to trigger semantic drift due to relatedness
    const driftDiff = report.diffs.find(diff => diff.path === "context.topic");
    expect(driftDiff).toBeDefined();
    expect(driftDiff!.isSemanticDrift).toBe(true);
    expect(driftDiff!.driftReason).toContain("topic");
  });

  it("should report no diffs if the state is identical", () => {
    const state: Record<string, any> = {
      user: "Bob",
      data: { count: 10, active: true },
    };
    const graph: ContextGraph = {
      user: { relatedFields: ["data"], semanticWeight: 0.4 },
      data: { relatedFields: ["user"], semanticWeight: 0.6 },
    };

    const report: SemanticDiffReport = ContextualStateDiffingV19(
      state, state, graph
    );

    expect(report.diffs).toHaveLength(0);
  });
});