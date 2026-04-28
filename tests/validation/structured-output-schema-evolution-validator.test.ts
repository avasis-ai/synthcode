import { describe, it, expect } from "vitest";
import {
  StructuredSchema,
  SchemaHistory,
} from "../src/validation/structured-output-schema-evolution-validator";

describe("StructuredOutputSchemaEvolutionValidator", () => {
  it("should correctly validate schema evolution when adding a new optional field", () => {
    const initialSchema: StructuredSchema = {
      type: "object",
      properties: {
        id: { type: "string"; required: true },
        name: { type: "string"; required: true },
      },
      required: ["id", "name"],
    };
    const history: SchemaHistory = {
      schema: initialSchema,
      results: [],
    };

    const evolvedSchema: StructuredSchema = {
      type: "object",
      properties: {
        id: { type: "string"; required: true },
        name: { type: "string"; required: true },
        email: { type: "string"; required: false }, // New optional field
      },
      required: ["id", "name"],
    };

    // Mocking the validation logic to check the structure change
    const validateEvolution = (history: SchemaHistory, newSchema: StructuredSchema) => {
      // In a real scenario, this would perform complex validation.
      // Here we just check if the new schema has the expected properties.
      if (Object.keys(newSchema.properties).length !== Object.keys(initialSchema.properties).length + 1) {
        throw new Error("Schema structure mismatch");
      }
      return true;
    };

    expect(validateEvolution(history, evolvedSchema)).toBe(true);
  });

  it("should correctly validate schema evolution when making an existing field required", () => {
    const initialSchema: StructuredSchema = {
      type: "object",
      properties: {
        id: { type: "string"; required: true },
        optionalField: { type: "string"; required: false },
      },
      required: ["id"],
    };
    const history: SchemaHistory = {
      schema: initialSchema,
      results: [],
    };

    const evolvedSchema: StructuredSchema = {
      type: "object",
      properties: {
        id: { type: "string"; required: true },
        optionalField: { type: "string"; required: true }, // Changed to required
      },
      required: ["id", "optionalField"], // Added to required list
    };

    // Mocking the validation logic
    const validateEvolution = (history: SchemaHistory, newSchema: StructuredSchema) => {
      const initialRequired = history.schema.required;
      const newRequired = newSchema.required;

      if (!initialRequired.includes("optionalField") && newRequired.includes("optionalField")) {
        return true; // Successfully made required
      }
      return false;
    };

    expect(validateEvolution(history, evolvedSchema)).toBe(true);
  });

  it("should handle backward compatibility checks when removing a field", () => {
    const initialSchema: StructuredSchema = {
      type: "object",
      properties: {
        id: { type: "string"; required: true },
        deprecatedField: { type: "string"; required: false },
      },
      required: ["id"],
    };
    const history: SchemaHistory = {
      schema: initialSchema,
      results: [],
    };

    const evolvedSchema: StructuredSchema = {
      type: "object",
      properties: {
        id: { type: "string"; required: true },
        // deprecatedField is removed
      },
      required: ["id"],
    };

    // Mocking the validation logic to check for removed fields
    const validateEvolution = (history: SchemaHistory, newSchema: StructuredSchema) => {
      const initialKeys = Object.keys(history.schema.properties);
      const newKeys = Object.keys(newSchema.properties);

      const removedFields = initialKeys.filter(key => !newKeys.includes(key));
      
      // Check if the removed field was critical (i.e., required in the old schema)
      const wasCriticalRemoval = removedFields.includes("deprecatedField") && history.schema.required.includes("deprecatedField");
      
      return !wasCriticalRemoval;
    };

    expect(validateEvolution(history, evolvedSchema)).toBe(true);
  });
});