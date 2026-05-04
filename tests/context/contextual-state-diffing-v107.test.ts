import { describe, it, expect } from "vitest";
import { StateDiffReport } from "../src/context/contextual-state-diffing-v107";
import { generateStateDiffReport } from "../src/context/contextual-state-diffing-v107";

describe("generateStateDiffReport", () => {
  it("should return an empty report when states are identical", () => {
    const state1 = {
      user: "Hello",
      history: [{ type: "user", content: "Hi" }],
      metadata: { version: 1 },
    };
    const state2 = {
      user: "Hello",
      history: [{ type: "user", content: "Hi" }],
      metadata: { version: 1 },
    };
    const report = generateStateDiffReport(state1, state2);
    expect(report.diff).toEqual({});
    expect(report.causalAnalysis).toEqual({
      gaps: [],
      reinforcements: [],
    });
  });

  it("should detect simple key differences in the state", () => {
    const state1 = {
      user: "Initial state",
      history: [{ type: "user", content: "Start" }],
      metadata: { version: 1 },
    };
    const state2 = {
      user: "Updated state",
      history: [{ type: "user", content: "Start" }],
      metadata: { version: 1 },
    };
    const report = generateStateDiffReport(state1, state2);
    expect(report.diff).toEqual({
      user: "Updated state",
      history: [{ type: "user", content: "Start" }],
      metadata: { version: 1 },
    });
    expect(report.causalAnalysis.gaps).toHaveLength(0);
  });

  it("should detect structural changes and potential causal links", () => {
    const state1 = {
      user: "Initial prompt.",
      history: [{ type: "user", content: "Initial" }],
      metadata: { version: 1, contextId: "abc" },
    };
    const state2 = {
      user: "Follow up prompt.",
      history: [{ type: "user", content: "Initial" }, { type: "assistant", content: "Response" }],
      metadata: { version: 2, contextId: "abc" },
    };
    const report = generateStateDiffReport(state1, state2);
    expect(report.diff).toEqual({
      user: "Follow up prompt.",
      history: [{ type: "user", content: "Initial" }, { type: "assistant", content: "Response" }],
      metadata: { version: 2, contextId: "abc" },
    });
    expect(report.causalAnalysis.gaps).toContain("Missing explicit link between user update and history change");
    expect(report.causalAnalysis.reinforcements).toContain("History update reinforces user intent");
  });
});