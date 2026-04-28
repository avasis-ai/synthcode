import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v57";

describe("StructuredToolOutputValidator", () => {
  it("should validate a correctly structured tool output", async () => {
    const validator = new StructuredToolOutputValidator();
    const mockOutput = {
      tool_name: "get_weather",
      parameters: {
        location: "San Francisco",
        unit: "celsius",
      },
      result: {
        temperature: 22,
        condition: "Sunny",
      },
    };
    const mockContext = { messages: [] };
    await expect(validator.validate(mockOutput, mockContext)).resolves.toBe(true);
  });

  it("should return false for missing required fields in the output", async () => {
    const validator = new StructuredToolOutputValidator();
    const mockOutput = {
      tool_name: "get_weather",
      parameters: {
        location: "New York",
      },
      // Missing 'result' field
    };
    const mockContext = { messages: [] };
    await expect(validator.validate(mockOutput, mockContext)).resolves.toBe(false);
  });

  it("should handle empty or null inputs gracefully", async () => {
    const validator = new StructuredToolOutputValidator();
    const mockContext = { messages: [] };
    await expect(validator.validate(null as any, mockContext)).rejects.toThrow();
    await expect(validator.validate(undefined as any, mockContext)).rejects.toThrow();
  });
});