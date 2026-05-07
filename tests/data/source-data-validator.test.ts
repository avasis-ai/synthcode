import { describe, it, expect } from "vitest";
import { SourceDataValidator } from "../src/data/source-data-validator";

describe("SourceDataValidator", () => {
  it("should validate and transform data successfully when all rules pass", () => {
    const schema = {
      name: {
        validate: (value) => ({
          isValid: typeof value === "string" && value.length > 0,
          errors: [],
          value: value,
        }),
        transform: (value) => value.toUpperCase(),
      },
      age: {
        validate: (value) => ({
          isValid: typeof value === "number" && value >= 0,
          errors: [],
          value: value,
        }),
        transform: (value) => value,
      },
    };
    const validator = new SourceDataValidator(schema);
    const rawData = { name: "john doe", age: 30 };
    const result = validator.validate(rawData);

    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({ name: "JOHN DOE", age: 30 });
  });

  it("should return invalid and collect errors when validation fails", () => {
    const schema = {
      name: {
        validate: (value) => ({
          isValid: typeof value === "string" && value.length > 0,
          errors: [],
          value: value,
        }),
      },
      email: {
        validate: (value) => ({
          isValid: typeof value === "string" && value.includes("@"),
          errors: [],
          value: value,
        }),
      },
    };
    const validator = new SourceDataValidator(schema);
    const rawData = { name: "", email: "invalid-email" };
    const result = validator.validate(rawData);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("name must be a non-empty string.");
    expect(result.errors).toContain("email must be a string containing '@'.");
  });

  it("should handle missing keys gracefully and only validate defined fields", () => {
    const schema = {
      requiredField: {
        validate: (value) => ({
          isValid: typeof value !== "undefined",
          errors: [],
          value: value,
        }),
      },
      optionalField: {
        validate: (value) => ({
          isValid: true,
          errors: [],
          value: value,
        }),
      },
    };
    const validator = new SourceDataValidator(schema);
    const rawData = { requiredField: "present", optionalField: undefined };
    const result = validator.validate(rawData);

    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({ requiredField: "present", optionalField: undefined });
  });
});