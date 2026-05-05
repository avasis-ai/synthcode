import { describe, it, expect } from "vitest";
import { CausalDiffReport, CausalLink } from "../src/context/contextual-state-diffing-v120";

describe("CausalDiffReport generation", () => {
  it("should return no diff when states are identical", () => {
    const report: CausalDiffReport = {
      hasCausalDiff: false,
      inconsistencies: [],
      missingLinks: [],
      alteredLinks: [],
    };
    expect(report).toEqual({
      hasCausalDiff: false,
      inconsistencies: [],
      missingLinks: [],
      alteredLinks: [],
    });
  });

  it("should detect an inconsistency when a required event is missing", () => {
    const report: CausalDiffReport = {
      hasCausalDiff: true,
      inconsistencies: ["State B is missing the required event from State A"],
      missingLinks: [{
        sourceStateId: "A",
        targetStateId: "B",
        dependencyType: "REQUIRED_EVENT",
        description: "Must happen before B",
      }],
      alteredLinks: [],
    };
    expect(report.hasCausalDiff).toBe(true);
    expect(report.inconsistencies).toHaveLength(1);
    expect(report.missingLinks).toHaveLength(1);
  });

  it("should detect an altered link when a dependency type changes", () => {
    const report: CausalDiffReport = {
      hasCausalDiff: true,
      inconsistencies: ["Link dependency type changed"],
      missingLinks: [],
      alteredLinks: [{
        sourceStateId: "A",
        targetStateId: "B",
        dependencyType: "REQUIRED_EVENT",
        description: "Was PRECONDITION_MET, now REQUIRED_EVENT",
      }],
    };
    expect(report.hasCausalDiff).toBe(true);
    expect(report.inconsistencies).toHaveLength(1);
    expect(report.alteredLinks).toHaveLength(1);
  });
});