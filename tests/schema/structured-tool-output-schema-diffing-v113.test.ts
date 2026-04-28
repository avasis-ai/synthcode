import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v113";

describe("StructuredToolOutputSchemaDiffer", () => {
  it("should correctly identify added fields", () => {
    const differ = new StructuredToolOutputSchemaDiffer();
    const schemaV1 = {
      name: "schema",
      properties: {
        fieldA: { type: "string" },
      },
    };
    const schemaV2 = {
      name: "schema",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
      },
    };

    const report = differ.compareSchemas(schemaV1, schemaV2);
    expect(report.summary.added).toBe(1);
    expect(report.diffs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "properties.fieldB",
        severity: "ADDED",
        message: expect.any(String),
      }),
    ]));
  });

  it("should correctly identify removed fields", () => {
    const differ = new StructuredToolOutputSchemaDiffer();
    const schemaV1 = {
      name: "schema",
      properties: {
        fieldA: { type: "string" },
        fieldC: { type: "boolean" },
      },
    };
    const schemaV2 = {
      name: "schema",
      properties: {
        fieldA: { type: "string" },
      },
    };

    const report = differ.compareSchemas(schemaV1, schemaV2);
    expect(report.summary.removed).toBe(1);
    expect(report.diffs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "properties.fieldC",
        severity: "REMOVED",
        message: expect.any(String),
      }),
    ]));
  });

  it("should detect type changes for existing fields", () => {
    const differ = new StructuredToolOutputSchemaDiffer();
    const schemaV1 = {
      name: "schema",
      properties: {
        fieldA: { type: "string" },
      },
    };
    const schemaV2 = {
      name: "schema",
      properties: {
        fieldA: { type: "number" },
      },
    };

    const report = differ.compareSchemas(schemaV1, schemaV2);
    expect(report.summary.typeChanges).toBe(1);
    expect(report.diffs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "properties.fieldA",
        severity: "TYPE_CHANGE",
        message: expect.any(String),
      }),
    ]));
  });
});