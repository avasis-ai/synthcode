import { describe, it, expect } from "vitest";
import {
  ValidationSummaryReport,
  AdvancedValidationSummaryEntry,
  ValidationFailure,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v139-advanced-v3";

describe("ValidationSummaryReport", () => {
  it("should correctly calculate total failures when given multiple entries", () => {
    const failures: AdvancedValidationSummaryEntry[] = [
      {
        failure: {
          sourceId: "source1",
          stage: "stageA",
          failureReason: "Reason A",
          severityWeight: 1,
          contextLineage: ["line1"],
        },
        isCritical: false,
      },
      {
        failure: {
          sourceId: "source2",
          stage: "stageB",
          failureReason: "Reason B",
          severityWeight: 2,
          contextLineage: ["line2"],
        },
        isCritical: true,
      },
      {
        failure: {
          sourceId: "source3",
          stage: "stageC",
          failureReason: "Reason C",
          severityWeight: 0.5,
          contextLineage: ["line3"],
        },
        isCritical: false,
      },
    ];
    const report = ValidationSummaryReport.create(failures);
    expect(report.totalFailures).toBe(3);
  });

  it("should calculate the weighted failure score correctly", () => {
    const failures: AdvancedValidationSummaryEntry[] = [
      {
        failure: {
          sourceId: "source1",
          stage: "stageA",
          failureReason: "Reason A",
          severityWeight: 1,
          contextLineage: ["line1"],
        },
        isCritical: false,
      },
      {
        failure: {
          sourceId: "source2",
          stage: "stageB",
          failureReason: "Reason B",
          severityWeight: 3,
          contextLineage: ["line2"],
        },
        isCritical: true,
      },
    ];
    const report = ValidationSummaryReport.create(failures);
    // Expected score: 1 + 3 = 4
    expect(report.weightedFailureScore).toBe(4);
  });

  it("should handle an empty list of failures gracefully", () => {
    const failures: AdvancedValidationSummaryEntry[] = [];
    const report = ValidationSummaryReport.create(failures);
    expect(report.totalFailures).toBe(0);
    expect(report.weightedFailureScore).toBe(0);
  });
});