import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV139,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v139";

describe("StructuredToolOutputValidationSummaryAggregatorV139", () => {
  it("should correctly aggregate validation summaries when all stages are valid", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139();
    const summary = await aggregator.aggregate(
      "stageA",
      {
        isValid: true,
        details: "Stage A passed validation.",
        conflicts: [],
      },
      "stageB",
      {
        isValid: true,
        details: "Stage B passed validation.",
        conflicts: [],
      },
    );

    expect(summary.length).toBe(2);
    expect(summary[0].sourceStage).toBe("stageA");
    expect(summary[0].isValid).toBe(true);
    expect(summary[1].sourceStage).toBe("stageB");
    expect(summary[1].isValid).toBe(true);
  });

  it("should correctly aggregate validation summaries when one stage has conflicts", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139();
    const conflict: any = {
      conflictType: "SchemaMismatch",
      severity: "ERROR",
      description: "Expected string but got number.",
      suggestedFix: "Ensure the field is a string.",
    };

    const summary = await aggregator.aggregate(
      "stageA",
      {
        isValid: true,
        details: "Stage A passed validation.",
        conflicts: [],
      },
      "stageB",
      {
        isValid: false,
        details: "Stage B failed validation.",
        conflicts: [conflict],
      },
    );

    expect(summary.length).toBe(2);
    const stageBSummary = summary.find((s) => s.sourceStage === "stageB");
    expect(stageBSummary).toBeDefined();
    expect(stageBSummary!.isValid).toBe(false);
    expect(stageBSummary!.conflicts.length).toBe(1);
    expect(stageBSummary!.conflicts[0].conflictType).toBe("SchemaMismatch");
  });

  it("should handle an empty aggregation call gracefully", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139();
    const summary = await aggregator.aggregate();

    expect(summary).toEqual([]);
  });
});