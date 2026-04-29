import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationSummaryAggregatorV1 } from "../src/validation/structured-tool-output-validation-summary-aggregator-v1";
import { ValidationFailure } from "../src/validation/structured-tool-output-validation-summary-aggregator-v1.types";

describe("StructuredToolOutputValidationSummaryAggregatorV1", () => {
  it("should correctly aggregate failures from multiple tool results", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV1();
    const failures: ValidationFailure[] = [
      {
        toolName: "toolA",
        step: "step1",
        errorType: "INVALID_INPUT",
        severity: "ERROR",
        message: "A failed validation",
      },
      {
        toolName: "toolB",
        step: "step2",
        errorType: "MISSING_FIELD",
        severity: "WARN",
        message: "B warned about missing field",
      },
      {
        toolName: "toolA",
        step: "step2",
        errorType: "INVALID_INPUT",
        severity: "ERROR",
        message: "A failed again",
      },
    ];

    const summary = aggregator.aggregate(failures);

    expect(summary.totalFailures).toBe(3);
    expect(summary.detailedFailures).toHaveLength(3);
    expect(summary.failureCounts).toEqual({
      "INVALID_INPUT": 2,
      "MISSING_FIELD": 1,
    });
    expect(summary.groupedFailures).toEqual({
      "toolA": [
        {
          toolName: "toolA",
          step: "step1",
          errorType: "INVALID_INPUT",
          severity: "ERROR",
          message: "A failed validation",
        },
        {
          toolName: "toolA",
          step: "step2",
          errorType: "INVALID_INPUT",
          severity: "ERROR",
          message: "A failed again",
        },
      ],
      "toolB": [
        {
          toolName: "toolB",
          step: "step2",
          errorType: "MISSING_FIELD",
          severity: "WARN",
          message: "B warned about missing field",
        },
      ],
    });
  });

  it("should return zero counts when provided with no failures", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV1();
    const summary = aggregator.aggregate([]);

    expect(summary.totalFailures).toBe(0);
    expect(summary.failureCounts).toEqual({});
    expect(summary.groupedFailures).toEqual({});
    expect(summary.detailedFailures).toHaveLength(0);
  });

  it("should correctly handle failures with mixed severity levels", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV1();
    const failures: ValidationFailure[] = [
      {
        toolName: "toolX",
        step: "init",
        errorType: "SETUP_ERROR",
        severity: "ERROR",
        message: "Critical setup failure",
      },
      {
        toolName: "toolY",
        step: "process",
        errorType: "DATA_WARN",
        severity: "WARN",
        message: "Data warning",
      },
      {
        toolName: "toolZ",
        step: "cleanup",
        errorType: "INFO_DETAIL",
        severity: "INFO",
        message: "Info detail logged",
      },
    ];

    const summary = aggregator.aggregate(failures);

    expect(summary.totalFailures).toBe(3);
    expect(summary.failureCounts).toEqual({
      "SETUP_ERROR": 1,
      "DATA_WARN": 1,
      "INFO_DETAIL": 1,
    });
    expect(summary.groupedFailures).toEqual({
      "toolX": [
        {
          toolName: "toolX",
          step: "init",
          errorType: "SETUP_ERROR",
          severity: "ERROR",
          message: "Critical setup failure",
        },
      ],
      "toolY": [
        {
          toolName: "toolY",
          step: "process",
          errorType: "DATA_WARN",
          severity: "WARN",
          message: "Data warning",
        },
      ],
      "toolZ": [
        {
          toolName: "toolZ",
          step: "cleanup",
          errorType: "INFO_DETAIL",
          severity: "INFO",
          message: "Info detail logged",
        },
      ],
    });
  });
});