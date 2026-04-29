import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1018 } from "../src/validation/structured-tool-output-schema-validator-v1018";

describe("StructuredToolOutputSchemaValidatorV1018", () => {
  it("should validate a simple object structure correctly", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1018({});
    const validData = {
      name: "Test Tool",
      version: 1.0,
      isEnabled: true,
    };
    await expect(validator.validate(validData)).resolves.toBe(true);
  });

  it("should fail validation for missing required fields", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1018({
      type: "object",
      properties: {
        requiredField: { type: "string" },
        optionalField: { type: "number" },
      },
      required: ["requiredField"],
    });
    const invalidData = {
      optionalField: 123,
    };
    await expect(validator.validate(invalidData)).rejects.toThrow(/Validation failed/);
  });

  it("should validate an array structure with defined item schema", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1018({
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              status: { type: "string" },
            },
            required: ["id", "status"],
          },
        },
      },
    });
    const validData = {
      results: [
        { id: 1, status: "success" },
        { id: 2, status: "pending" },
      ],
    };
    await expect(validator.validate(validData)).resolves.toBe(true);
  });
});