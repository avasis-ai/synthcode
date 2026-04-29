import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1010";

describe("SchemaValidator", () => {
  it("should validate a correctly structured output object", () => {
    const validator = new SchemaValidator({
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
      crossFieldConstraints: [
        {
          id: "age_positive",
          validate: (data) => {
            if (typeof data.age === "number" && data.age < 0) {
              return ["Age must be a positive number."];
            }
            return [];
          },
        },
      ],
    });

    const validData = { name: "Alice", age: 30 };
    const errors = validator.validate(validData);
    expect(errors).toEqual([]);
  });

  it("should return errors for missing required fields", () => {
    const validator = new SchemaValidator({
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
      crossFieldConstraints: [],
    });

    const invalidData = { name: "Bob" }; // Missing age
    const errors = validator.validate(invalidData);
    expect(errors).toContain("Missing required field: age");
  });

  it("should return errors for type mismatches and cross-field constraints", () => {
    const validator = new SchemaValidator({
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
      crossFieldConstraints: [
        {
          id: "age_positive",
          validate: (data) => {
            if (typeof data.age === "number" && data.age < 0) {
              return ["Age must be a positive number."];
            }
            return [];
          },
        },
      ],
    });

    const invalidData = { name: 123, age: -5 }; // name wrong type, age violates constraint
    const errors = validator.validate(invalidData);
    expect(errors).toContain("Type mismatch for 'name': Expected string, got number");
    expect(errors).toContain("Age must be a positive number.");
  });
});