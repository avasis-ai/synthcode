import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v20";
import { Schema } from "../src/validation/structured-tool-output-validation-pipeline-v20.types";

describe("StructuredToolOutputValidator", () => {
  it("should validate correctly when all steps pass", () => {
    const mockSchema: Schema = {
      id: "test",
    };
    const mockSteps: (() => {
      const step: (data: Record<string, unknown>) => {
        return { isValid: true, errors: [] };
      };
      return step;
    }[] = [() => {
      const step: (data: Record<string, unknown>) => {
        return { isValid: true, errors: [] };
      };
      return step;
    }, () => {
      const step: (data: Record<string, unknown>) => {
        return { isValid: true, errors: [] };
      };
      return step;
    }];

    const validator = new StructuredToolOutputValidator(mockSchema, mockSteps);
    const result = validator.validate({});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid and collect errors when any step fails", () => {
    const mockSchema: Schema = {
      id: "test",
    };
    const failingStep: (() => {
      const step: (data: Record<string, unknown>) => {
        return { isValid: false, errors: ["Error in step 1"] };
      };
      return step;
    }) = [() => {
      const step: (data: Record<string, unknown>) => {
        return { isValid: false, errors: ["Error in step 1"] };
      };
      return step;
    }, () => {
      const step: (data: Record<string, unknown>) => {
        return { isValid: true, errors: [] };
      };
      return step;
    }];

    const validator = new StructuredToolOutputValidator(mockSchema, failingStep);
    const result = validator.validate({});

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Error in step 1");
  });

  it("should handle an empty set of validation steps gracefully", () => {
    const mockSchema: Schema = {
      id: "test",
    };
    const mockSteps: (() => {
      const step: (data: Record<string, unknown>) => {
        return { isValid: true, errors: [] };
      };
      return step;
    }[] = [];

    const validator = new StructuredToolOutputValidator(mockSchema, mockSteps);
    const result = validator.validate({});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});