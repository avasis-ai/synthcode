import { describe, it, expect } from "vitest";
import {
  runValidationPipeline,
  ValidationResult,
  ValidationError,
} from "../src/validation/tool-output-schema-validation-pipeline";

describe("runValidationPipeline", () => {
  it("should return valid result when input matches schema", async () => {
    const schema = {
      name: { type: "string" },
      age: { type: "number" },
    };
    const input = { name: "Test", age: 30 };
    const result: ValidationResult = await runValidationPipeline(input, schema);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.coercedOutput).toEqual(input);
  });

  it("should return invalid result with errors when input is missing fields", async () => {
    const schema = {
      name: { type: "string" },
      email: { type: "string", required: true },
    };
    const input = { name: "Test" };
    const result: ValidationResult = await runValidationPipeline(input, schema);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("email is required");
    expect(result.coercedOutput).toEqual({ name: "Test" });
  });

  it("should coerce types correctly when possible", async () => {
    const schema = {
      id: { type: "number" },
      isActive: { type: "boolean" },
    };
    const input = { id: "123", isActive: "true" };
    const result: ValidationResult = await runValidationPipeline(input, schema);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.coercedOutput).toEqual({ id: 123, isActive: true });
  });
});