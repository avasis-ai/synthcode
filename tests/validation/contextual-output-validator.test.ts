import { describe, it, expect } from "vitest";
import { ContextualOutputValidator } from "../src/validation/contextual-output-validator";
import { ExecutionContext } from "../src/validation/contextual-output-validator.types";

describe("ContextualOutputValidator", () => {
  it("should validate data correctly when all steps pass", async () => {
    const mockContext: ExecutionContext = {
      history: [],
      globalState: {},
      currentStep: "step1",
    };
    const validator = new ContextualOutputValidator<string>();
    validator.addStep({
      validate: (data: string, context: ExecutionContext) => ({
        isValid: true,
        errors: [],
      }),
    });

    const result = validator.validate("some data", mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors when any step fails validation", async () => {
    const mockContext: ExecutionContext = {
      history: [],
      globalState: {},
      currentStep: "step2",
    };
    const validator = new ContextualOutputValidator<number>();
    validator.addStep({
      validate: (data: number, context: ExecutionContext) => {
        if (data < 0) {
          return { isValid: false, errors: ["Data cannot be negative"] };
        }
        return { isValid: true, errors: [] };
      },
    });

    const result = validator.validate(-5, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Data cannot be negative");
  });

  it("should aggregate errors from multiple failing steps", async () => {
    const mockContext: ExecutionContext = {
      history: [],
      globalState: {},
      currentStep: "step3",
    };
    const validator = new ContextualOutputValidator<string>();
    validator.addStep({
      validate: (data: string, context: ExecutionContext) => {
        const errors: string[] = [];
        if (data.length < 5) {
          errors.push("Too short");
        }
        if (data.includes("fail")) {
          errors.push("Contains forbidden word");
        }
        return { isValid: errors.length === 0, errors };
      },
    });
    validator.addStep({
      validate: (data: string, context: ExecutionContext) => ({
        isValid: data.length > 10,
        errors: data.length <= 10 ? ["Too short (second check)"] : [],
      }),
    });

    const result = validator.validate("fail", mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Too short", "Contains forbidden word", "Too short (second check)"]));
  });
});