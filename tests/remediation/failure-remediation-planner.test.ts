import { describe, it, expect, vi } from "vitest";
import { FailureRemediationPlanner } from "../src/remediation/failure-remediation-planner.js";

describe("FailureRemediationPlanner", () => {
  it("should generate a basic remediation plan for a RateLimitError", () => {
    const planner = new FailureRemediationPlanner();
    const failureReport = {
      context: "API call failed",
      failedStep: "fetchUserData",
      errorType: "RateLimitError",
      details: {
        retryAfterSeconds: 60,
      },
    };

    const plan = planner.generatePlan(failureReport);

    expect(plan).toBeDefined();
    expect(plan.remediationSteps).toHaveLength(1);
    expect(plan.remediationSteps[0].action).toBe("Retry");
    expect(plan.remediationSteps[0].description).toContain("Rate limit exceeded");
  });

  it("should generate an escalation plan for a MissingContext error", () => {
    const planner = new FailureRemediationPlanner();
    const failureReport = {
      context: "User profile processing",
      failedStep: "processProfile",
      errorType: "MissingContext",
      details: {
        missingField: "user_id",
      },
    };

    const plan = planner.generatePlan(failureReport);

    expect(plan).toBeDefined();
    expect(plan.remediationSteps).toHaveLength(2);
    expect(plan.remediationSteps[0].action).toBe("QueryData");
    expect(plan.remediationSteps[0].description).toContain("Missing context");
    expect(plan.remediationSteps[1].action).toBe("EscalateHuman");
    expect(plan.remediationSteps[1].description).toContain("Human intervention required");
  });

  it("should prioritize switching tools for a ToolFailure", () => {
    const planner = new FailureRemediationPlanner();
    const failureReport = {
      context: "Data extraction",
      failedStep: "extractData",
      errorType: "ToolFailure",
      details: {
        originalTool: "ToolA",
        suggestedTool: "ToolB",
      },
    };

    const plan = planner.generatePlan(failureReport);

    expect(plan).toBeDefined();
    expect(plan.remediationSteps).toHaveLength(1);
    expect(plan.remediationSteps[0].action).toBe("SwitchTool");
    expect(plan.remediationSteps[0].description).toContain("Tool failure detected");
    expect(plan.remediationSteps[0].suggestedParameters).toEqual({
      newTool: "ToolB",
    });
  });
});