import { describe, it, expect } from "vitest";
import {
  ConflictWeight,
  ValidationFailure,
  SeverityWeightedSummary,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v124-advanced";

describe("StructuredToolOutputValidationSummaryAggregatorV124Advanced", () => {
  it("should correctly calculate the total weighted score from multiple failures", () => {
    const failures: ValidationFailure[] = [
      { severity: ConflictWeight.CRITICAL, source: "A", message: "Critical issue" },
      { severity: ConflictWeight.ERROR, source: "B", message: "Error issue" },
      { severity: ConflictWeight.CRITICAL, source: "C", message: "Another critical" },
    ];

    const summary = {
      totalWeightedScore: 10 + 5 + 10,
      breakdown: {
        [ConflictWeight.CRITICAL]: 2,
        [ConflictWeight.ERROR]: 1,
        [ConflictWeight.WARNING]: 0,
        [ConflictWeight.INFO]: 0,
      },
      failureCount: 3,
    };

    expect(summary).toEqual({
      totalWeightedScore: 25,
      breakdown: {
        [ConflictWeight.CRITICAL]: 2,
        [ConflictWeight.ERROR]: 1,
        [ConflictWeight.WARNING]: 0,
        [ConflictWeight.INFO]: 0,
      },
      failureCount: 3,
    });
  });

  it("should handle an empty list of failures resulting in zero scores", () => {
    const failures: ValidationFailure[] = [];

    const summary: SeverityWeightedSummary = {
      totalWeightedScore: 0,
      breakdown: {
        [ConflictWeight.CRITICAL]: 0,
        [ConflictWeight.ERROR]: 0,
        [ConflictWeight.WARNING]: 0,
        [ConflictWeight.INFO]: 0,
      },
      failureCount: 0,
    };

    expect(summary).toEqual({
      totalWeightedScore: 0,
      breakdown: {
        [ConflictWeight.CRITICAL]: 0,
        [ConflictWeight.ERROR]: 0,
        [ConflictWeight.WARNING]: 0,
        [ConflictWeight.INFO]: 0,
      },
      failureCount: 0,
    });
  });

  it("should correctly aggregate counts for all severity levels", () => {
    const failures: ValidationFailure[] = [
      { severity: ConflictWeight.WARNING, source: "X", message: "Warning 1" },
      { severity: ConflictWeight.INFO, source: "Y", message: "Info 1" },
      { severity: ConflictWeight.WARNING, source: "Z", message: "Warning 2" },
      { severity: ConflictWeight.INFO, source: "W", message: "Info 2" },
    ];

    const summary: SeverityWeightedSummary = {
      totalWeightedScore: 2 + 1 + 2 + 1,
      breakdown: {
        [ConflictWeight.CRITICAL]: 0,
        [ConflictWeight.ERROR]: 0,
        [ConflictWeight.WARNING]: 2,
        [ConflictWeight.INFO]: 2,
      },
      failureCount: 4,
    };

    expect(summary).toEqual({
      totalWeightedScore: 6,
      breakdown: {
        [ConflictWeight.CRITICAL]: 0,
        [ConflictWeight.ERROR]: 0,
        [ConflictWeight.WARNING]: 2,
        [ConflictWeight.INFO]: 2,
      },
      failureCount: 4,
    });
  });
});