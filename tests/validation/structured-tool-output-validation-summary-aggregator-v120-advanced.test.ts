import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV120Advanced,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v120-advanced";
import {
  ValidationSummary,
  ConflictResolutionMetadata,
} from "../src/validation/types";

describe("StructuredToolOutputValidationSummaryAggregatorV120Advanced", () => {
  it("should correctly aggregate validation summaries when all sources are valid", async () => {
    const mockSummaries: ValidationSummary[] = [
      {
        sourceId: "source1",
        schemaName: "schemaA",
        isValid: true,
        details: { field1: "value1" },
        timestamp: Date.now() - 1000,
      },
      {
        sourceId: "source2",
        schemaName: "schemaA",
        isValid: true,
        details: { field1: "value2" },
        timestamp: Date.now(),
      },
    ];
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV120Advanced();
    const result = await aggregator.aggregate(mockSummaries);

    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(true);
    expect(result[0].details).toEqual({
      field1: ["value1", "value2"],
    });
  });

  it("should correctly handle conflicts and apply the specified conflict resolution strategy", async () => {
    const mockSummaries: ValidationSummary[] = [
      {
        sourceId: "source1",
        schemaName: "schemaB",
        isValid: false,
        details: { fieldX: "conflict1" },
        timestamp: Date.now() - 2000,
      },
      {
        sourceId: "source2",
        schemaName: "schemaB",
        isValid: false,
        details: { fieldX: "conflict2" },
        timestamp: Date.now() - 1000,
      },
      {
        sourceId: "source3",
        schemaName: "schemaB",
        isValid: false,
        details: { fieldX: "conflict3" },
        timestamp: Date.now(),
      },
    ];
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV120Advanced();
    const result = await aggregator.aggregate(mockSummaries, "STRICTEST");

    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(false);
    expect(result[0].details).toEqual({
      fieldX: {
        conflictDetails: {
          field: "fieldX",
          conflictResolution: "STRICTEST",
          resolvedValue: null,
          sourcesConsidered: ["source1", "source2", "source3"],
        },
        values: ["conflict1", "conflict2", "conflict3"],
      },
    });
  });

  it("should aggregate correctly when some sources are invalid and others are valid", async () => {
    const mockSummaries: ValidationSummary[] = [
      {
        sourceId: "sourceA",
        schemaName: "schemaC",
        isValid: true,
        details: { fieldY: "validValue" },
        timestamp: Date.now() - 3000,
      },
      {
        sourceId: "sourceB",
        schemaName: "schemaC",
        isValid: false,
        details: { fieldY: "invalidValue" },
        timestamp: Date.now() - 2000,
      },
    ];
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV120Advanced();
    const result = await aggregator.aggregate(mockSummaries, "AVERAGE");

    expect(result.length).toBe(1);
    expect(result[0].isValid).toBe(false);
    expect(result[0].details).toEqual({
      fieldY: {
        conflictDetails: {
          field: "fieldY",
          conflictResolution: "AVERAGE",
          resolvedValue: "validValue",
          sourcesConsidered: ["sourceA", "sourceB"],
        },
        values: ["validValue", "invalidValue"],
      },
    });
  });
});