import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1024 } from "../src/validation/structured-tool-output-schema-validator-v1024";

describe("StructuredToolOutputSchemaValidatorV1024", () => {
  it("should validate a correctly structured tool output against the schema", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1024();
    const validOutput = {
      toolName: "exampleTool",
      output: {
        id: "123",
        result: "success",
        data: {
          value: 42,
          timestamp: new Date().toISOString(),
        },
      },
    };
    const result = await validator.validate(validOutput, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation if required fields are missing in the output", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1024();
    const invalidOutput = {
      toolName: "exampleTool",
      output: {
        id: "123",
        // 'result' field is missing
        data: {
          value: 42,
          timestamp: new Date().toISOString(),
        },
      },
    };
    const result = await validator.validate(invalidOutput, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Missing required field: result");
  });

  it("should handle complex type validation failures (e.g., incorrect data type)", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1024();
    const invalidOutput = {
      toolName: "exampleTool",
      output: {
        id: "123",
        result: "success",
        data: {
          value: "not_a_number", // Should be a number
          timestamp: "invalid-date", // Should be a valid ISO date
        },
      },
    };
    const result = await validator.validate(invalidOutput, {});
    expect(result.isValid).toBe(false);
    // Expect at least one error related to type mismatch
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: expect.stringContaining("data.value") }),
      expect.objectContaining({ message: expect.stringContaining("data.timestamp") }),
    ]));
  });
});