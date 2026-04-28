import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaEvolutionValidatorV1 } from "../src/validation/structured-tool-output-schema-evolution-validator-v1";

describe("StructuredToolOutputSchemaEvolutionValidatorV1", () => {
  it("should detect no schema drift when schemas are identical", () => {
    const oldSchema: any = {
      fields: {
        name: { type: "string", required: true },
        age: { type: "number", required: false },
      },
    };
    const newSchema: any = {
      fields: {
        name: { type: "string", required: true },
        age: { type: "number", required: false },
      },
    };
    const validator = new StructuredToolOutputSchemaEvolutionValidatorV1();
    const report = validator.validate(oldSchema, newSchema, { name: "Test", age: 30 });

    expect(report.isSchemaDriftDetected).toBe(false);
    expect(report.fieldChanges).toHaveLength(0);
    expect(report.missingFields).toHaveLength(0);
    expect(report.unexpectedFields).toHaveLength(0);
  });

  it("should detect missing and unexpected fields when schema evolves", () => {
    const oldSchema: any = {
      fields: {
        name: { type: "string", required: true },
        email: { type: "string", required: true },
      },
    };
    const newSchema: any = {
      fields: {
        name: { type: "string", required: true },
        city: { type: "string", required: false },
      },
    };
    const data: Record<string, unknown> = { name: "Test", email: "test@example.com", city: "New York" };
    const validator = new StructuredToolOutputSchemaEvolutionValidatorV1();
    const report = validator.validate(oldSchema, newSchema, data);

    expect(report.isSchemaDriftDetected).toBe(true);
    expect(report.missingFields).toContain("email");
    expect(report.unexpectedFields).toContain("email"); // Assuming data might contain old fields not in new schema
    expect(report.fieldChanges).toHaveLength(1); // Only 'city' is new/changed structure
  });

  it("should detect added required fields in the new schema", () => {
    const oldSchema: any = {
      fields: {
        id: { type: "string", required: true },
      },
    };
    const newSchema: any = {
      fields: {
        id: { type: "string", required: true },
        status: { type: "string", required: true },
      },
    };
    const data: Record<string, unknown> = { id: "123", status: "active" };
    const validator = new StructuredToolOutputSchemaEvolutionValidatorV1();
    const report = validator.validate(oldSchema, newSchema, data);

    expect(report.isSchemaDriftDetected).toBe(true);
    expect(report.missingFields).toHaveLength(0);
    expect(report.unexpectedFields).toHaveLength(0);
    expect(report.fieldChanges).toContainEqual({
      field: "status",
      changeType: "ADDED",
      details: "New field added to the schema.",
    });
  });
});