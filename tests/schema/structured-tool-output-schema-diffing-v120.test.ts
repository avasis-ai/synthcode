import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v120";

describe("StructuredToolOutputSchemaDiffer", () => {
  it("should return an empty report when schemas are identical", () => {
    const oldSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const newSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const report = StructuredToolOutputSchemaDiffer.diffSchemas(oldSchema, newSchema);
    expect(report.differences).toHaveLength(0);
  });

  it("should detect a missing property in the new schema", () => {
    const oldSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        optionalField: { type: "boolean" },
      },
    };
    const newSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const report = StructuredToolOutputSchemaDiffer.diffSchemas(oldSchema, newSchema);
    expect(report.differences).toHaveLength(1);
    expect(report.differences[0].path).toBe("optionalField");
    expect(report.differences[0].type).toBe("removed");
  });

  it("should detect an added property in the new schema", () => {
    const oldSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const newSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        newField: { type: "number" },
      },
    };
    const report = StructuredToolOutputSchemaDiffer.diffSchemas(oldSchema, newSchema);
    expect(report.differences).toHaveLength(1);
    expect(report.differences[0].path).toBe("newField");
    expect(report.differences[0].type).toBe("added");
  });
});