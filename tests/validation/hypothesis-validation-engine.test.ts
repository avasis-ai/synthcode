import { describe, it, expect } from "vitest";
import { Hypothesis, ValidationResult } from "../src/validation/hypothesis-validation-engine.js";
import { validateHypothesis } from "../src/validation/hypothesis-validation-engine.js";

describe("validateHypothesis", () => {
  it("should return valid result for a simple, valid hypothesis", async () => {
    const validHypothesis: Hypothesis = {
      steps: [
        {
          toolName: "toolA",
          inputs: {
            param1: "value1",
          },
          assumptions: ["A is true"],
        },
        {
          toolName: "toolB",
          inputs: {
            param2: 123,
          },
          assumptions: ["B is true"],
        },
      ],
      initialContext: {
        user: "testUser",
        date: "2023-01-01",
      },
    };

    const result: ValidationResult = await validateHypothesis(validHypothesis);

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.suggestedFixes).toHaveLength(0);
  });

  it("should detect missing required inputs in a hypothesis step", async () => {
    const invalidHypothesis: Hypothesis = {
      steps: [
        {
          toolName: "toolA",
          inputs: {
            // Missing required input 'requiredParam'
            optionalParam: "value",
          },
          assumptions: ["A is true"],
        },
      ],
      initialContext: {
        user: "testUser",
      },
    };

    const result: ValidationResult = await validateHypothesis(invalidHypothesis);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("Missing required input: requiredParam for toolA");
    expect(result.suggestedFixes).toHaveLength(1);
  });

  it("should detect conflicting assumptions or context issues", async () => {
    const conflictingHypothesis: Hypothesis = {
      steps: [
        {
          toolName: "toolC",
          inputs: {
            dataId: "123",
          },
          assumptions: ["A is true", "B is false"],
        },
      ],
      initialContext: {
        // Context might conflict with assumptions
        user: "admin",
        status: "active",
      },
    };

    const result: ValidationResult = await validateHypothesis(conflictingHypothesis);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("Contextual conflict detected: status 'active' contradicts assumption 'B is false'");
    expect(result.suggestedFixes).toContain("Review context variables against stated assumptions.");
  });
});