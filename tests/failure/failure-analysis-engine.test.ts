import { describe, it, expect } from "vitest";
import { FailureAnalysisEngine, FailureReport, CorrectionPlan } from "../failure-analysis-engine";

describe("FailureAnalysisEngine", () => {
  it("should generate a basic failure report for a constraint violation", () => {
    const engine = new FailureAnalysisEngine();
    const report = engine.analyzeFailure(
      "ConstraintViolation",
      "The generated output must be under 500 characters.",
      "The output was 600 characters long.",
      "step-1"
    );

    expect(report.failureType).toBe("ConstraintViolation");
    expect(report.context).toContain("under 500 characters");
    expect(report.evidence).toContain("600 characters long");
    expect(report.failedStepId).toBe("step-1");
  });

  it("should suggest a correction plan when a tool failure is detected", () => {
    const engine = new FailureAnalysisEngine();
    const report = engine.analyzeFailure(
      "ToolFailure",
      "The external API call failed due to authentication.",
      "API returned 401 Unauthorized.",
      "step-3"
    );

    const plan = engine.generateCorrectionPlan(report);

    expect(plan.isCorrectionNecessary).toBe(true);
    expect(plan.rootCauseAnalysis).toContain("authentication");
    expect(plan.suggestedModifications).toHaveLength(1);
    expect(plan.suggestedModifications[0].stepId).toBe("step-3");
    expect(plan.suggestedModifications[0].modification).toContain("re-authenticate");
  });

  it("should handle unknown failure types gracefully", () => {
    const engine = new FailureAnalysisEngine();
    const report = engine.analyzeFailure(
      "Unknown",
      "General unexpected failure.",
      "System encountered an unhandled exception.",
      "step-5"
    );

    const plan = engine.generateCorrectionPlan(report);

    expect(report.failureType).toBe("Unknown");
    expect(plan.isCorrectionNecessary).toBe(true);
    expect(plan.rootCauseAnalysis).toContain("unhandled exception");
  });
});