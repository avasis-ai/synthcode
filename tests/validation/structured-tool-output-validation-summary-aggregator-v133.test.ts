import { describe, it, expect } from "vitest";
import { AggregatedValidationSummary, ValidationFailure } from "../src/validation/structured-tool-output-validation-summary-aggregator-v133";

describe("StructuredToolOutputValidationSummaryAggregatorV133", () => {
  it("should correctly aggregate validation failures from a list of failures", () => {
    const failures: ValidationFailure[] = [
      { type: "schema_drift", field: "fieldA", message: "Drift A", severity: "error" },
      { type: "cross_field_error", field: "fieldB", message: "Cross B", severity: "warning" },
      { type: "schema_drift", field: "fieldC", message: "Drift C", severity: "error" },
      { type: "temporal_violation", field: "fieldD", message: "Time D", severity: "info" },
      { type: "schema_drift", field: "fieldE", message: "Drift E", severity: "error" },
    ];

    const summary = AggregatedValidationSummary.aggregate(failures);

    expect(summary.totalFailures).toBe(5);
    expect(summary.errorCount).toBe(3);
    expect(summary.warningCount).toBe(1);
    expect(summary.infoCount).toBe(1);
    expect(summary.failuresByType).toEqual({
      schema_drift: 3,
      cross_field_error: 1,
      temporal_violation: 1,
      unknown: 0,
    });
  });

  it("should return zero counts when given an empty array of failures", () => {
    const failures: ValidationFailure[] = [];
    const summary = AggregatedValidationSummary.aggregate(failures);

    expect(summary.totalFailures).toBe(0);
    expect(summary.errorCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.infoCount).toBe(0);
    expect(summary.failuresByType).toEqual({
      schema_drift: 0,
      cross_field_error: 0,
      temporal_violation: 0,
      unknown: 0,
    });
  });

  it("should handle mixed severity levels correctly", () => {
    const failures: ValidationFailure[] = [
      { type: "schema_drift", field: "f1", message: "Error", severity: "error" },
      { type: "cross_field_error", field: "f2", message: "Warning", severity: "warning" },
      { type: "temporal_violation", field: "f3", message: "Info", severity: "info" },
      { type: "schema_drift", field: "f4", message: "Another Error", severity: "error" },
    ];

    const summary = AggregatedValidationSummary.aggregate(failures);

    expect(summary.totalFailures).toBe(4);
    expect(summary.errorCount).toBe(2);
    expect(summary.warningCount).toBe(1);
    expect(summary.infoCount).toBe(1);
  });
});