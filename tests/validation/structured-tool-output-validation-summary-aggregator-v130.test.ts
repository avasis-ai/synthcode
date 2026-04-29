import { describe, it, expect } from "vitest";
import { AggregatedValidationSummary } from "../src/validation/structured-tool-output-validation-summary-aggregator-v130";

describe("AggregatedValidationSummary", () => {
  it("should correctly initialize with zero counts for a successful run", () => {
    const summary: AggregatedValidationSummary = {
      overallSuccess: true,
      totalChecks: 0,
      failedChecks: 0,
      summaryBySeverity: { INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 },
      correlatedFailures: [],
      detailedFailures: {},
    };
    expect(summary.overallSuccess).toBe(true);
    expect(summary.totalChecks).toBe(0);
    expect(summary.failedChecks).toBe(0);
    expect(summary.summaryBySeverity).toEqual({ INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 });
    expect(summary.correlatedFailures).toEqual([]);
    expect(summary.detailedFailures).toEqual({});
  });

  it("should correctly aggregate counts when some checks fail", () => {
    const summary: AggregatedValidationSummary = {
      overallSuccess: false,
      totalChecks: 5,
      failedChecks: 2,
      summaryBySeverity: { INFO: 3, WARN: 1, ERROR: 0, CRITICAL: 0 },
      correlatedFailures: [
        {
          stepId: "stepA",
          primaryError: "Error A",
          relatedErrors: ["Related A1"],
          severity: "ERROR",
        },
      ],
      detailedFailures: {
        "validation_rule_1": { count: 2, firstError: "Error A", lastError: "Error A" },
      },
    };
    expect(summary.overallSuccess).toBe(false);
    expect(summary.totalChecks).toBe(5);
    expect(summary.failedChecks).toBe(2);
    expect(summary.summaryBySeverity.INFO).toBe(3);
    expect(summary.summaryBySeverity.WARN).toBe(1);
    expect(summary.correlatedFailures.length).toBe(1);
    expect(summary.detailedFailures["validation_rule_1"].count).toBe(2);
  });

  it("should handle multiple correlated failures with different severities", () => {
    const summary: AggregatedValidationSummary = {
      overallSuccess: false,
      totalChecks: 3,
      failedChecks: 2,
      summaryBySeverity: { INFO: 1, WARN: 0, ERROR: 1, CRITICAL: 1 },
      correlatedFailures: [
        {
          stepId: "stepB",
          primaryError: "Critical Failure",
          relatedErrors: ["Related B1"],
          severity: "CRITICAL",
        },
        {
          stepId: "stepC",
          primaryError: "Error C",
          relatedErrors: ["Related C1", "Related C2"],
          severity: "ERROR",
        },
      ],
      detailedFailures: {
        "stepB_check": { count: 1, firstError: "Critical Failure", lastError: "Critical Failure" },
      },
    };
    expect(summary.correlatedFailures.length).toBe(2);
    expect(summary.correlatedFailures[0].severity).toBe("CRITICAL");
    expect(summary.correlatedFailures[1].severity).toBe("ERROR");
    expect(summary.summaryBySeverity.CRITICAL).toBe(1);
    expect(summary.summaryBySeverity.ERROR).toBe(1);
  });
});