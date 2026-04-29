import { describe, it, expect } from "vitest";
import {
  aggregateValidationSummary,
} from "../structured-tool-output-validation-summary-aggregator-v129";

describe("aggregateValidationSummary", () => {
  it("should correctly aggregate multiple validation results into a summary", () => {
    const results: ValidationResult[] = [
      {
        ruleId: "rule1",
        fieldPath: "fieldA",
        severity: "error",
        message: "Error A",
        source: "source1",
      },
      {
        ruleId: "rule2",
        fieldPath: "fieldB",
        severity: "warning",
        message: "Warning B",
        source: "source2",
      },
      {
        ruleId: "rule1",
        fieldPath: "fieldA",
        severity: "error",
        message: "Another Error A",
        source: "source1",
      },
    ];

    const summary = aggregateValidationSummary(results);

    expect(summary).toHaveLength(2); // Should have two unique entries for fieldA and fieldB
    expect(summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "rule1",
          fieldPath: "fieldA",
          severity: "error",
          message: "Error A", // Should take the first encountered message or a representative one
          source: "source1",
        }),
        expect.objectContaining({
          ruleId: "rule2",
          fieldPath: "fieldB",
          severity: "warning",
          message: "Warning B",
          source: "source2",
        }),
      ]),
    );
  });

  it("should return an empty array when given an empty array of results", () => {
    const results: ValidationResult[] = [];
    const summary = aggregateValidationSummary(results);
    expect(summary).toEqual([]);
  });

  it("should handle results from different sources correctly", () => {
    const results: ValidationResult[] = [
      {
        ruleId: "ruleX",
        fieldPath: "fieldX",
        severity: "info",
        message: "Info X",
        source: "sourceA",
      },
      {
        ruleId: "ruleX",
        fieldPath: "fieldX",
        severity: "info",
        message: "Info X",
        source: "sourceB",
      },
    ];

    const summary = aggregateValidationSummary(results);

    expect(summary).toHaveLength(1);
    expect(summary[0].fieldPath).toBe("fieldX");
    expect(summary[0].source).toBe("sourceA"); // Should retain the first source encountered
  });
});