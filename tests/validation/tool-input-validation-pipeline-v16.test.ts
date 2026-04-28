import { describe, it, expect } from "vitest";
import {
  ValidationContext,
  ValidationResult,
  validateToolInputPipelineV16,
} from "../src/validation/tool-input-validation-pipeline-v16";

describe("validateToolInputPipelineV16", () => {
  it("should return valid result for correct inputs", () => {
    const context: ValidationContext = {
      messages: [],
      toolName: "testTool",
      toolInput: {
        param1: "value1",
        param2: 123,
      },
      state: {},
    };
    const result: ValidationResult = validateToolInputPipelineV16(
      context
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required inputs", () => {
    const context: ValidationContext = {
      messages: [],
      toolName: "testTool",
      toolInput: {
        param1: undefined,
        param2: 123,
      },
      state: {},
    };
    const result: ValidationResult = validateToolInputPipelineV16(
      context
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("param1 is required");
  });

  it("should handle empty tool input gracefully", () => {
    const context: ValidationContext = {
      messages: [],
      toolName: "testTool",
      toolInput: {},
      state: {},
    };
    const result: ValidationResult = validateToolInputPipelineV16(
      context
    );
    // Assuming empty input is valid if no parameters are strictly required by the tool definition
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});