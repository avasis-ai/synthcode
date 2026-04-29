import { describe, it, expect } from "vitest";
import {
  ConflictResolutionStrategy,
  FieldConflict,
  MergeReport,
} from "../src/schema/structured-tool-output-schema-merger-v1001_new";
import {StructuredToolOutputSchemaMerger} from "../src/schema/structured-tool-output-schema-merger-v1001_new";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge two simple schemas with no conflicts", () => {
    const schema1 = {
      type: "object",
      properties: {
        name: {type: "string"},
        age: {type: "number"},
      },
      required: ["name", "age"],
    };
    const schema2 = {
      type: "object",
      properties: {
        email: {type: "string"},
        age: {type: "number"},
      },
      required: ["email"],
    };

    const merger = new StructuredToolOutputSchemaMerger();
    const report = merger.merge(schema1, schema2);

    expect(report.totalSchemasMerged).toBe(2);
    expect(report.fieldConflicts.length).toBe(0);
    expect(report.strategyUsed).toBe(ConflictResolutionStrategy.PreferString);
  });

  it("should detect and report a type conflict when merging", () => {
    const schema1 = {
      type: "object",
      properties: {
        id: {type: "string"},
      },
      required: ["id"],
    };
    const schema2 = {
      type: "object",
      properties: {
        id: {type: "number"},
      },
      required: ["id"],
    };

    const merger = new StructuredToolOutputSchemaMerger();
    const report = merger.merge(schema1, schema2);

    expect(report.totalSchemasMerged).toBe(2);
    expect(report.fieldConflicts.length).toBe(1);
    const conflict = report.fieldConflicts[0];
    expect(conflict.fieldName).toBe("id");
    expect(conflict.resolution).toBe("Union");
  });

  it("should handle merging when a field exists in both but with compatible types (e.g., string and number that can be unioned)", () => {
    const schema1 = {
      type: "object",
      properties: {
        value: {type: "string"},
      },
      required: ["value"],
    };
    const schema2 = {
      type: "object",
      properties: {
        value: {type: "number"},
      },
      required: ["value"],
    };

    const merger = new StructuredToolOutputSchemaMerger();
    const report = merger.merge(schema1, schema2);

    expect(report.totalSchemasMerged).toBe(2);
    expect(report.fieldConflicts.length).toBe(1);
    const conflict = report.fieldConflicts[0];
    expect(conflict.fieldName).toBe("value");
    expect(conflict.resolution).toBe("Union");
  });
});