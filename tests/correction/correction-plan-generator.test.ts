import { describe, it, expect } from "vitest";
import { generateCorrectionPlan } from "../src/correction/correction-plan-generator";

describe("generateCorrectionPlan", () => {
  it("should generate a basic correction plan when inputs are provided", async () => {
    const inputs = {
      data: "invalid data",
      context: "user profile",
      severity: "high",
    };
    const plan = await generateCorrectionPlan(inputs);

    expect(plan).toHaveProperty("stepId");
    expect(plan).toHaveProperty("action");
    expect(plan).toHaveProperty("description");
    expect(plan).toHaveProperty("requiredInputs");
    expect(plan.requiredInputs).toEqual({
      data: "string",
      context: "string",
      severity: "string",
    });
  });

  it("should handle missing context gracefully", async () => {
    const inputs = {
      data: "invalid data",
      context: undefined,
      severity: "medium",
    };
    const plan = await generateCorrectionPlan(inputs);

    expect(plan.action).toContain("Review");
    expect(plan.description).toContain("context");
  });

  it("should return a minimal plan if no specific corrections are needed", async () => {
    const inputs = {
      data: "valid data",
      context: "user profile",
      severity: "low",
    };
    const plan = await generateCorrectionPlan(inputs);

    expect(plan.action).toContain("Acknowledge");
    expect(plan.description).toContain("no immediate action");
  });
});