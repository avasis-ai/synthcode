import { describe, it, expect } from "vitest";
import { StrucThoughtStepValidatorAdvancedAdvanced } from "../src/validation/structured-thought-step-validator-advanced-advanced";

describe("StrucThoughtStepValidatorAdvancedAdvanced", () => {
  it("should validate a basic sequence of thought steps correctly", () => {
    const validator = new StrucThoughtStepValidatorAdvancedAdvanced();
    const steps: any[] = [
      { type: "query", content: "Initial user query" },
      { type: "reasoning", content: "Step 1 reasoning" },
      { type: "plan", content: "Step 1 plan" },
      { type: "reflection", content: "Step 1 reflection" },
    ];
    const context = new Map<string, any>();
    const result = validator.validate(steps, steps[steps.length - 1], context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect an invalid sequence order (e.g., missing reasoning after query)", () => {
    const validator = new StrucThoughtStepValidatorAdvancedAdvanced();
    const steps: any[] = [
      { type: "query", content: "Initial user query" },
      { type: "plan", content: "Skipped reasoning" }, // Invalid jump
      { type: "reflection", content: "Reflection" },
    ];
    const context = new Map<string, any>();
    const result = validator.validate(steps, steps[steps.length - 1], context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Expected 'reasoning' step after 'query' before 'plan'.");
  });

  it("should handle an empty or incomplete step list gracefully", () => {
    const validator = new StrucThoughtStepValidatorAdvancedAdvanced();
    const steps: any[] = [];
    const context = new Map<string, any>();
    const result = validator.validate(steps, { type: "query", content: "" }, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Thought step sequence cannot be empty.");
  });
});