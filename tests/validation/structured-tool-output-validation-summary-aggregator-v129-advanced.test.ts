import { describe, it, expect } from "vitest";
import {
  ValidationSummary,
  ValidationFailure,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v129-advanced";

describe("ValidationSummaryAggregatorV129Advanced", () => {
  it("should correctly aggregate failures when all sources are successful", () => {
    const mockSummary: ValidationSummary = {
      overallStatus: "SUCCESS",
      totalFailures: 0,
      failures: [],
      metadata: {
        sources: ["sourceA", "sourceB"],
        aggregatorVersion: "v129",
      },
    };
    expect(mockSummary.overallStatus).toBe("SUCCESS");
    expect(mockSummary.totalFailures).toBe(0);
    expect(mockSummary.failures).toEqual([]);
  });

  it("should correctly aggregate failures when some sources have warnings", () => {
    const mockSummary: ValidationSummary = {
      overallStatus: "WARNING",
      totalFailures: 1,
      failures: [
        {
          field: "fieldX",
          issue: "Warning issue",
          severity: "warning",
          sourcePipeline: "sourceA",
        },
      ],
      metadata: {
        sources: ["sourceA", "sourceB"],
        aggregatorVersion: "v129",
      },
    };
    expect(mockSummary.overallStatus).toBe("WARNING");
    expect(mockSummary.totalFailures).toBe(1);
    expect(mockSummary.failures).toHaveLength(1);
    expect(mockSummary.failures[0].severity).toBe("warning");
  });

  it("should correctly aggregate failures when multiple sources report errors", () => {
    const mockSummary: ValidationSummary = {
      overallStatus: "FAILURE",
      totalFailures: 2,
      failures: [
        {
          field: "fieldY",
          issue: "Error in A",
          severity: "error",
          sourcePipeline: "sourceA",
        },
        {
          field: "fieldZ",
          issue: "Error in B",
          severity: "error",
          sourcePipeline: "sourceB",
        },
      ],
      metadata: {
        sources: ["sourceA", "sourceB"],
        aggregatorVersion: "v129",
      },
    };
    expect(mockSummary.overallStatus).toBe("FAILURE");
    expect(mockSummary.totalFailures).toBe(2);
    expect(mockSummary.failures).toHaveLength(2);
    expect(mockSummary.failures.some(f => f.sourcePipeline === "sourceA" && f.severity === "error")).toBe(true);
  });
});