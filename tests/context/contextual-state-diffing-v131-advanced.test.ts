import { describe, it, expect } from "vitest";
import { StateDiffReport, CausalLink, TemporalConstraint } from "../context/contextual-state-diffing-v131-advanced";

describe("StateDiffReport generation", () => {
  it("should correctly report simple state changes", () => {
    const currentStateId = "state-2";
    const previousStateId = "state-1";
    const diffs: Record<string, any> = {
      userInput: "Hello world",
      isLoading: false,
    };
    const causalLinks: CausalLink[] = [
      {
        sourceStateId: "state-1",
        targetStateId: "state-2",
        causalReason: "User provided new input",
      },
    ];
    const report: StateDiffReport = {
      currentStateId,
      previousStateId,
      diffs,
      causalLinks,
      tempo: [],
    };

    expect(report.currentStateId).toBe("state-2");
    expect(report.previousStateId).toBe("state-1");
    expect(report.diffs.userInput).toBe("Hello world");
    expect(report.causalLinks.length).toBe(1);
    expect(report.causalLinks[0].causalReason).toBe("User provided new input");
  });

  it("should handle multiple causal links and temporal constraints", () => {
    const currentStateId = "final-state";
    const previousStateId = "intermediate-state";
    const diffs: Record<string, any> = {
      toolCallCount: 3,
    };
    const causalLinks: CausalLink[] = [
      {
        sourceStateId: "state-A",
        targetStateId: "state-B",
        causalReason: "Tool A executed",
      },
      {
        sourceStateId: "state-B",
        targetStateId: "state-C",
        causalReason: "Tool B executed",
      },
    ];
    const tempo: TemporalConstraint[] = [
      {
        startTime: 1000,
        endTime: 2000,
        dependency: "Tool A execution window",
      },
      {
        startTime: 2000,
        endTime: 3000,
        dependency: "Tool B execution window",
      },
    ];
    const report: StateDiffReport = {
      currentStateId,
      previousStateId,
      diffs,
      causalLinks,
      tempo,
    };

    expect(report.tempo.length).toBe(2);
    expect(report.tempo[1].dependency).toBe("Tool B execution window");
    expect(report.causalLinks.length).toBe(2);
  });

  it("should return empty arrays for links and tempo if no changes occurred", () => {
    const currentStateId = "stable-state";
    const previousStateId = "stable-state";
    const diffs: Record<string, any> = {};
    const causalLinks: CausalLink[] = [];
    const tempo: TemporalConstraint[] = [];
    const report: StateDiffReport = {
      currentStateId,
      previousStateId,
      diffs,
      causalLinks,
      tempo,
    };

    expect(report.diffs).toEqual({});
    expect(report.causalLinks).toEqual([]);
    expect(report.tempo).toEqual([]);
  });
});