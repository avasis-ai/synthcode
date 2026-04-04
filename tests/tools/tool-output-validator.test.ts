import { describe, it, expect } from "vitest";
import { ToolOutputValidator } from "../src/tools/tool-output-validator";
import { ToolResultMessage } from "../src/tools/types";

describe("ToolOutputValidator", () => {
  it("should validate tool output correctly when data matches the schema", () => {
    const mockValidator: any = (data: unknown) => ({ isValid: true, errors: [] });
    const validator = new ToolOutputValidator(mockValidator);

    const mockToolOutput: ToolResultMessage = {
      toolName: "testTool",
      output: "{\"key\": \"value\"}",
      status: "SUCCESS",
    };

    const result = validator.validate(mockToolOutput, mockValidator);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validatedData).toEqual({
      toolName: "testTool",
      output: "{\"key\": \"value\"}",
      status: "SUCCESS",
    });
  });

  it("should report invalid data when the schema validation fails", () => {
    const mockValidator: any = (data: unknown) => ({ isValid: false, errors: ["Schema mismatch"] });
    const validator = new ToolOutputValidator(mockValidator);

    const mockToolOutput: ToolResultMessage = {
      toolName: "testTool",
      output: "invalid json",
      status: "FAILURE",
    };

    const result = validator.validate(mockToolOutput, mockValidator);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Schema mismatch"]);
    expect(result.validatedData).toEqual({
      toolName: "testTool",
      output: "invalid json",
      status: "FAILURE",
    });
  });

  it("should return partial data even if validation fails", () => {
    const mockValidator: any = (data: unknown) => ({ isValid: false, errors: ["Some error"] });
    const validator = new ToolOutputValidator(mockValidator);

    const mockToolOutput: ToolResultMessage = {
      toolName: "testTool",
      output: "{}",
      status: "SUCCESS",
    };

    const result = validator.validate(mockToolOutput, mockValidator);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Some error"]);
    expect(result.validatedData).toEqual({
      toolName: "testTool",
      output: "{}",
      status: "SUCCESS",
    });
  });
});