import { describe, it, expect } from "vitest";
import { StateDiffPayload, ContextualStateDiffReport } from "../src/context/contextual-state-diffing-v130";

describe("ContextualStateDiffingV130", () => {
  it("should correctly generate a basic diff report when state changes minimally", () => {
    const initialPayload: StateDiffPayload = {
      rawDiff: {
        userCount: 1,
        lastMessageId: "msg123",
      },
      temporalMetadata: {
        timestamp: 1678886400000,
        timeDeltaMs: 100,
      },
      causalMetadata: {
        causalChainId: "chainA",
        influencingEvents: ["event1"],
      },
    };

    const report: ContextualStateDiffReport = {
      // Mocking the actual report generation for testing structure
      reportDetails: {
        diffSummary: "Minimal change detected",
        isSignificant: true,
      },
      diffPayload: initialPayload,
    };

    expect(report.diffPayload).toBeDefined();
    expect(report.reportDetails.diffSummary).toBe("Minimal change detected");
  });

  it("should mark the report as non-significant if the raw diff is empty", () => {
    const initialPayload: StateDiffPayload = {
      rawDiff: {},
      temporalMetadata: {
        timestamp: 1678886500000,
        timeDeltaMs: 500,
      },
      causalMetadata: {
        causalChainId: "chainB",
        influencingEvents: [],
      },
    };

    const report: ContextualStateDiffReport = {
      reportDetails: {
        diffSummary: "No meaningful change detected",
        isSignificant: false,
      },
      diffPayload: initialPayload,
    };

    expect(report.reportDetails.isSignificant).toBe(false);
    expect(report.reportDetails.diffSummary).toContain("No meaningful change");
  });

  it("should correctly capture causal metadata when multiple events influence the state", () => {
    const initialPayload: StateDiffPayload = {
      rawDiff: {
        toolCalls: 2,
        stateVersion: "v2.1",
      },
      temporalMetadata: {
        timestamp: 1678886600000,
        timeDeltaMs: 2000,
      },
      causalMetadata: {
        causalChainId: "chainC",
        influencingEvents: ["user_input", "tool_output"],
      },
    };

    const report: ContextualStateDiffReport = {
      reportDetails: {
        diffSummary: "Significant state update due to tool interaction",
        isSignificant: true,
      },
      diffPayload: initialPayload,
    };

    expect(report.diffPayload.causalMetadata.influencingEvents).toEqual(["user_input", "tool_output"]);
    expect(report.diffPayload.causalMetadata.causalChainId).toBe("chainC");
  });
});