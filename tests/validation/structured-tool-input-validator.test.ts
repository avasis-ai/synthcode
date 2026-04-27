import { describe, it, expect } from "vitest";
import { StructuredToolInputValidator } from "../src/validation/structured-tool-input-validator";
import { z } from "zod";

describe("StructuredToolInputValidator", () => {
  it("should validate data correctly against a basic schema", () => {
    const schema = z.object({
      name: z.string().min(3),
      age: z.number().int().positive(),
    });
    const validator = new StructuredToolInputValidator(schema, {});

    const validData = { name: "Alice", age: 30 };
    const errors = validator.validate(validData);
    expect(errors).toEqual([]);

    const invalidData = { name: "Al", age: -5 };
    const errorsWithValidation = validator.validate(invalidData);
    expect(errorsWithValidation).toHaveLength(2);
  });

  it("should handle missing required fields", () => {
    const schema = z.object({
      requiredField: z.string(),
      optionalField: z.string().optional(),
    });
    const validator = new StructuredToolInputValidator(schema, {});

    const invalidData = { optionalField: "test" };
    const errors = validator.validate(invalidData);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("requiredField");
  });

  it("should incorporate custom validators", () => {
    const schema = z.object({
      email: z.string().email(),
      customField: z.string().optional(),
    });
    const customValidator: Record<string, any> = {
      customField: (data) => {
        if (typeof data === 'string' && data.includes("bad")) {
          return [{ field: "customField", message: "Cannot contain 'bad'", code: "CUSTOM_ERROR" }];
        }
        return null;
      },
    };
    const validator = new StructuredToolInputValidator(schema, customValidator);

    const dataWithCustomError = { email: "test@example.com", customField: "this is bad data" };
    const errors = validator.validate(dataWithCustomError);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("CUSTOM_ERROR");
  });
});