import { describe, it, expect } from "vitest";
import { SchemaEvolutionValidator, SchemaHistory } from "../src/validation/structured-tool-output-schema-validator-v103_advanced-advanced";

describe("SchemaEvolutionValidator", () => {
  it("should return isValid true for an unchanged schema", () => {
    const validator: SchemaEvolutionValidator = new SchemaEvolutionValidator();
    const history: SchemaHistory = {
      schemas: [{ version: 1, schema: { fieldA: { type: "string", required: true } } }],
      lastVersion: 1,
    };
    const proposedSchema: Record<string, any> = { fieldA: { type: "string", required: true } };

    const result = validator.validate(history, proposedSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect a change in a required field's type", () => {
    const validator: SchemaEvolutionValidator = new SchemaEvolutionValidator();
    const history: SchemaHistory = {
      schemas: [{ version: 1, schema: { fieldA: { type: "string", required: true } } }],
      lastVersion: 1,
    };
    // Change type from string to number
    const proposedSchema: Record<string, any> = { fieldA: { type: "number", required: true } };

    const result = validator.validate(history, proposedSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Schema change detected for fieldA: Type changed from string to number.");
  });

  it("should detect the addition of a new optional field", () => {
    const validator: SchemaEvolutionValidator = new SchemaEvolutionValidator();
    const history: SchemaHistory = {
      schemas: [{ version: 1, schema: { fieldA: { type: "string", required: true } } }],
      lastVersion: 1,
    };
    // Add a new optional field
    const proposedSchema: Record<string, any> = { fieldA: { type: "string", required: true }, fieldB: { type: "boolean", required: false } };

    const result = validator.validate(history, proposedSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Schema change detected for fieldB: New field added.");
  });
});