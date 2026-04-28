import { describe, it, expect } from "vitest";
import { StructuredToolInputSchemaValidatorV55 } from "../src/validation/structured-tool-input-schema-validator-v55";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("StructuredToolInputSchemaValidatorV55", () => {
  it("should initialize correctly with provided steps", () => {
    const mockSteps: any[] = [
      { name: "step1", validate: () => ({ isValid: true, errors: [] }) },
      { name: "step2", validate: () => ({ isValid: true, errors: [] }) },
    ];
    const validator = new StructuredToolInputSchemaValidatorV55(mockSteps);
    expect(validator).toBeInstanceOf(StructuredToolInputSchemaValidatorV55);
  });

  it("should return isValid: true and no errors when all steps pass validation", () => {
    const mockSteps: any[] = [
      { name: "step1", validate: () => ({ isValid: true, errors: [] }) },
      { name: "step2", validate: () => ({ isValid: true, errors: [] }) },
    ];
    const validator = new StructuredToolInputSchemaValidatorV55(mockSteps);
    const result = validator.validate(
      { key: "value" },
      { history: [], currentToolUse: null }
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from all failing steps", () => {
    const mockSteps: any[] = [
      { name: "step1", validate: () => ({ isValid: false, errors: ["Error in step 1"] }) },
      { name: "step2", validate: () => ({ isValid: false, errors: ["Error in step 2"] }) },
    ];
    const validator = new StructuredToolInputSchemaValidatorV55(mockSteps);
    const result = validator.validate(
      {},
      { history: [], currentToolUse: null }
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in step 1", "Error in step 2"]);
  });
});