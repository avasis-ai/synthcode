import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v130";

describe("StructuredToolOutputSchemaDiffer", () => {
  it("should return an empty report when schemas are identical", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const report = StructuredToolOutputSchemaDiffer.diffSchemas(schemaA, schemaB);
    expect(report.diffs).toEqual([]);
  });

  it("should detect a missing field when comparing schemas", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        optionalField: { type: "boolean" },
      },
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const report = StructuredToolOutputSchemaDiffer.diffSchemas(schemaA, schemaB);
    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].fieldPath).toBe("optionalField");
    expect(report.diffs[0].changeType).toBe("removed");
  });

  it("should detect an added field when comparing schemas", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        newField: { type: "number" },
      },
    };
    const report = StructuredToolOutputSchemaDiffer.diffSchemas(schemaA, schemaB);
    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].fieldPath).toBe("newField");
    expect(report.diffs[0].changeType).toBe("added");
  });
});