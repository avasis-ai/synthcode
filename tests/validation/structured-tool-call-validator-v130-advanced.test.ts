import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorAdvanced, ToolCall, Context } from "../src/validation/structured-tool-call-validator-v130-advanced";

describe("StructuredToolCallValidatorAdvanced", () => {
  const mockContext: Context = {
    currentTime: new Date("2023-10-27T10:00:00Z"),
    timeWindowStart: new Date("2023-10-27T09:00:00Z"),
    timeWindowEnd: new Date("2023-10-27T11:00:00Z"),
    availableResources: {
      "cpu": { capacity: 10, unit: "cores" },
      "memory": { capacity: 1024, unit: "MB" },
    },
  };

  it("should validate a correctly structured tool call", () => {
    const validator = new StructuredToolCallValidatorAdvanced(mockContext);
    const validToolCall: ToolCall = {
      name: "get_weather",
      input: { location: "New York", unit: "celsius" },
    };
    const result = validator.validate(validToolCall);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid for a tool call missing the name", () => {
    const validator = new StructuredToolCallValidatorAdvanced(mockContext);
    const invalidToolCall: ToolCall = {
      name: "", // Intentionally empty or missing structure check
      input: { location: "London" },
    };
    const result = validator.validate(invalidToolCall);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should return invalid for a tool call with an unsupported input structure", () => {
    const validator = new StructuredToolCallValidatorAdvanced(mockContext);
    const invalidToolCall: ToolCall = {
      name: "process_data",
      input: { data: [1, 2, 3], invalid_key: "value" }, // Assuming some keys are restricted
    };
    const result = validator.validate(invalidToolCall);
    expect(result.isValid).toBe(false);
    // Depending on the actual implementation, we check for the presence of errors related to input structure
    expect(result.errors).toContainEqual(expect.stringContaining("input validation failed"));
  });
});