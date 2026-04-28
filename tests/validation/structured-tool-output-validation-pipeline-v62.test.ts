import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v62";

describe("StructuredToolOutputValidator", () => {
  it("should return valid result for correctly structured output", () => {
    const validator = new StructuredToolOutputValidator();
    const mockOutput = {
      toolName: "someTool",
      result: {
        data: [1, 2, 3],
        success: true,
      },
    };
    const mockContext = {
      userId: "user123",
      sessionId: "session456",
    };
    const result = validator.validate(mockOutput, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required fields", () => {
    const validator = new StructuredToolOutputValidator();
    const mockOutput = {
      toolName: "someTool",
      // 'result' is missing
    };
    const mockContext = {
      userId: "user123",
      sessionId: "session456",
    };
    const result = validator.validate(mockOutput, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("result");
  });

  it("should handle temporal consistency checks correctly", () => {
    const validator = new StructuredToolOutputValidator();
    const mockOutput = {
      toolName: "timeTool",
      result: {
        timestamp: Date.now(),
      },
    };
    const mockContext = {
      lastRunTime: Date.now() - 1000,
    };
    const result = validator.validateTemporalConsistency(mockOutput, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});