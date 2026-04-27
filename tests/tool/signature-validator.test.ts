import { describe, it, expect } from "vitest";
import { ToolSignatureValidator } from "../src/tool/signature-validator";
import { z } from "zod";

describe("ToolSignatureValidator", () => {
  it("should return isValid true for valid arguments", () => {
    const definition = {
      name: "test",
      description: "A test tool",
      parameters: z.object({
        param1: z.string(),
        param2: z.number().optional(),
      }),
    };
    const validator = new ToolSignatureValidator();
    const args = { param1: "test_value", param2: 123 };
    const result = validator.validate(definition, args);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return isValid false and an error message for missing required arguments", () => {
    const definition = {
      name: "test",
      description: "A test tool",
      parameters: z.object({
        param1: z.string(),
        param2: z.number(),
      }),
    };
    const validator = new ToolSignatureValidator();
    const args = { param1: "test_value" };
    const result = validator.validate(definition, args);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe("string");
  });

  it("should return isValid false and an error message for incorrect argument types", () => {
    const definition = {
      name: "test",
      description: "A test tool",
      parameters: z.object({
        param1: z.string(),
        param2: z.number(),
      }),
    };
    const validator = new ToolSignatureValidator();
    const args = { param1: 123, param2: "not_a_number" };
    const result = validator.validate(definition, args);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});