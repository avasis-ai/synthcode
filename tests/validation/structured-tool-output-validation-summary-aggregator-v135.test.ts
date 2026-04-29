import { describe, it, expect } from "vitest";
import { StructuredValidationSummary } from "../src/validation/structured-tool-output-validation-summary-aggregator-v135";

describe("StructuredValidationSummary", () => {
  it("should correctly initialize with zero counts when no data is provided", () => {
    const summary: StructuredValidationSummary = {
      totalEntries: 0,
      totalFailures: 0,
      failureBreakdown: {
        CRITICAL: 0,
        ERROR: 0,
        WARNING: 0,
        INFO: 0,
      },
    };
    expect(summary.totalEntries).toBe(0);
    expect(summary.totalFailures).toBe(0);
    expect(summary.failureBreakdown.CRITICAL).toBe(0);
  });

  it("should correctly aggregate counts when multiple entries are processed", () => {
    const summary: StructuredValidationSummary = {
      totalEntries: 3,
      totalFailures: 2,
      failureBreakdown: {
        CRITICAL: 1,
        ERROR: 1,
        WARNING: 0,
        INFO: 0,
      },
    };
    expect(summary.totalEntries).toBe(3);
    expect(summary.totalFailures).toBe(2);
    expect(summary.failureBreakdown.CRITICAL).toBe(1);
    expect(summary.failureBreakdown.ERROR).toBe(1);
    expect(summary.failureBreakdown.WARNING).toBe(0);
  });

  it("should handle a scenario with only successful validations", () => {
    const summary: StructuredValidationSummary = {
      totalEntries: 5,
      totalFailures: 0,
      failureBreakdown: {
        CRITICAL: 0,
        ERROR: 0,
        WARNING: 0,
        INFO: 0,
      },
    };
    expect(summary.totalEntries).toBe(5);
    expect(summary.totalFailures).toBe(0);
    expect(Object.values(summary.failureBreakdown)).toEqual([0, 0, 0, 0]);
  });
});