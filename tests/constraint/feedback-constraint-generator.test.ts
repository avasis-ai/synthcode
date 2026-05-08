import { describe, it, expect } from "vitest";
import { generateFeedbackConstraint } from "../src/constraint/feedback-constraint-generator";

describe("generateFeedbackConstraint", () => {
  it("should generate a system_rule constraint for high severity user feedback", async () => {
    const feedback: any = {
      rawFeedback: "The system frequently fails to save data when the network is unstable.",
      source: "user",
      severity: "high",
    };
    const constraint = await generateFeedbackConstraint(feedback);

    expect(constraint).toBeDefined();
    expect(constraint.type).toBe("system_rule");
    expect(constraint.priority).toBeGreaterThanOrEqual(5);
    expect(constraint.description).toContain("data saving");
    expect(constraint.actionable).toBe(true);
  });

  it("should generate a data_format constraint for low severity system feedback", async () => {
    const feedback: any = {
      rawFeedback: "The date format displayed in the report is inconsistent (MM/DD/YY vs DD-MM-YY).",
      source: "system",
      severity: "low",
    };
    const constraint = await generateFeedbackConstraint(feedback);

    expect(constraint).toBeDefined();
    expect(constraint.type).toBe("data_format");
    expect(constraint.priority).toBeLessThan(3);
    expect(constraint.description).toContain("date format");
    expect(constraint.actionable).toBe(true);
  });

  it("should generate a behavioral constraint for medium severity manual feedback", async () => {
    const feedback: any = {
      rawFeedback: "The onboarding flow is confusing and users get lost trying to find the settings menu.",
      source: "manual",
      severity: "medium",
    };
    const constraint = await generateFeedbackConstraint(feedback);

    expect(constraint).toBeDefined();
    expect(constraint.type).toBe("behavioral");
    expect(constraint.priority).toBeBetween(3, 5);
    expect(constraint.description).toContain("onboarding flow");
    expect(constraint.actionable).toBe(true);
  });
});