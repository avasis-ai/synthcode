import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v132";
import { Schema, FieldSchema } from "../src/schema/schema-types";

describe("StructuredToolOutputSchemaDiffer", () => {
  it("should report correctly when a field is added", () => {
    const oldSchema: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };
    const newSchema: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
    };

    const report = StructuredToolOutputSchemaDiffer.diffSchemas(oldSchema, newSchema);
    expect(report.addedFields).toContain("age");
    expect(report.removedFields).toHaveLength(0);
    expect(report.modifiedFields).toHaveLength(0);
  });

  it("should report correctly when a field is removed", () => {
    const oldSchema: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    };
    const newSchema: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const report = StructuredToolOutputSchemaDiffer.diffSchemas(oldSchema, newSchema);
    expect(report.addedFields).toHaveLength(0);
    expect(report.removedFields).toContain("email");
    expect(report.modifiedFields).toHaveLength(0);
  });

  it("should report correctly when a field is modified", () => {
    const oldSchema: Schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        isActive: { type: "boolean" },
      },
    };
    const newSchema: Schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        isActive: { type: "string" },
      },
    };

    const report = StructuredToolOutputSchemaDiffer.diffSchemas(oldSchema, newSchema);
    expect(report.addedFields).toHaveLength(0);
    expect(report.removedFields).toHaveLength(0);
    expect(report.modifiedFields).toHaveLength(1);
    expect(report.modifiedFields[0].field).toBe("isActive");
    expect(report.modifiedFields[0].oldValue).toEqual({ type: "boolean" });
    expect(report.modifiedFields[0].newValue).toEqual({ type: "string" });
  });
});