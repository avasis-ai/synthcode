import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffingV129 } from "../src/schema/structured-tool-output-schema-diffing-v129";

describe("StructuredToolOutputSchemaDiffingV129", () => {
  it("should generate a diff report when fields are added", () => {
    const schemaV1 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
      },
    };
    const schemaV2 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        newFieldB: { type: "number" },
      },
    };

    const report = StructuredToolOutputSchemaDiffingV129.generateDiffReport(schemaV1, schemaV2);

    expect(report.addedFields).toHaveLength(1);
    expect(report.addedFields[0].field).toBe("newFieldB");
    expect(report.removedFields).toHaveLength(0);
  });

  it("should generate a diff report when fields are removed", () => {
    const schemaV1 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        removedFieldC: { type: "boolean" },
      },
    };
    const schemaV2 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
      },
    };

    const report = StructuredToolOutputSchemaDiffingV129.generateDiffReport(schemaV1, schemaV2);

    expect(report.addedFields).toHaveLength(0);
    expect(report.removedFields).toHaveLength(1);
    expect(report.removedFields[0].field).toBe("removedFieldC");
    expect(report.typeChanges).toHaveLength(0);
  });

  it("should generate a diff report when field types change", () => {
    const schemaV1 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
      },
    };
    const schemaV2 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "string" },
      },
    };

    const report = StructuredToolOutputSchemaDiffingV129.generateDiffReport(schemaV1, schemaV2);

    expect(report.addedFields).toHaveLength(0);
    expect(report.removedFields).toHaveLength(0);
    expect(report.typeChanges).toHaveLength(1);
    expect(report.typeChanges[0].field).toBe("fieldB");
    expect(report.typeChanges[0].fromType).toBe("number");
    expect(report.typeChanges[0].toType).toBe("string");
  });
});