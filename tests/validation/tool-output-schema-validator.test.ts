import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidator } from "../src/validation/tool-output-schema-validator";
import { z } from "zod";

describe("ToolOutputSchemaValidator", () => {
  it("should return isValid: true and empty errors for valid input", () => {
    const schema = z.object({
      id: z.string().uuid(),
      name: z.string(),
    });
    const validator = new ToolOutputSchemaValidator(schema);
    const validOutput = {
      id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      name: "Test Tool Output",
    };
    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return isValid: false and appropriate errors for invalid input (missing field)", () => {
    const schema = z.object({
      id: z.string().uuid(),
      name: z.string(),
    });
    const validator = new ToolOutputSchemaValidator(schema);
    const invalidOutput = {
      id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    };
    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Required");
  });

  it("should return isValid: false and appropriate errors for invalid input (wrong type)", () => {
    const schema = z.object({
      id: z.string().uuid(),
      name: z.string(),
    });
    const validator = new ToolOutputSchemaValidator(schema);
    const invalidOutput = {
      id: "not-a-uuid",
      name: 12345,
    };
    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("Invalid uuid"),
      expect.stringContaining("Expected string, received number"),
    ]));
  });
});