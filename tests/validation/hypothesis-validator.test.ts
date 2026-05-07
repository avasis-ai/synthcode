import { describe, it, expect } from "vitest";
import { validateHypothesis } from "../src/validation/hypothesis-validator";

describe("validateHypothesis", () => {
  it("should return a high confidence score when all required context is present and steps succeed", async () => {
    const hypothesis = {
      hypothesis: "The system can successfully identify the user's intent.",
      requiredContext: ["user_profile", "conversation_history"],
      testSteps: [
        { toolName: "analyze_intent", input: {} },
        { toolName: "check_history", input: {} },
      ],
    };
    const mockContext = {
      user_profile: "Profile data available.",
      conversation_history: "History available.",
    };
    const report = await validateHypothesis(hypothesis, mockContext);
    expect(report.overallConfidenceScore).toBeGreaterThan(0.8);
    expect(report.validationReport.contextCheck).toEqual({
      requiredContext: ["user_profile", "conversation_history"],
      missingContext: [],
      isContextSufficient: true,
    });
  });

  it("should lower the confidence score when required context is missing", async () => {
    const hypothesis = {
      hypothesis: "The system can successfully identify the user's intent.",
      requiredContext: ["user_profile", "conversation_history", "user_location"],
      testSteps: [
        { toolName: "analyze_intent", input: {} },
      ],
    };
    const mockContext = {
      user_profile: "Profile data available.",
      conversation_history: "History available.",
      // user_location is missing
    };
    const report = await validateHypothesis(hypothesis, mockContext);
    expect(report.overallConfidenceScore).toBeLessThan(0.8);
    expect(report.validationReport.contextCheck).toEqual({
      requiredContext: ["user_profile", "conversation_history", "user_location"],
      missingContext: ["user_location"],
      isContextSufficient: false,
    });
  });

  it("should adjust confidence based on failed test steps", async () => {
    const hypothesis = {
      hypothesis: "The system can successfully process complex requests.",
      requiredContext: ["user_profile"],
      testSteps: [
        { toolName: "analyze_intent", input: {} },
        { toolName: "process_data", input: { data: "complex" } },
      ],
    };
    const mockContext = {
      user_profile: "Profile data available.",
    };
    // Mocking the internal tool execution logic to simulate failure for the second step
    jest.spyOn(require("../src/validation/hypothesis-validator")).mockImplementation(async (h, c) => {
      if (h.testSteps[1].toolName === "process_data") {
        return {
          ...await validateHypothesis(h, c),
          validationReport: {
            ...await validateHypothesis(h, c).validationReport,
            testStepsCheck: {
              steps: [
                { step: h.testSteps[0], success: true, evidence: "Success", confidenceAdjustment: 0.1 },
                { step: h.testSteps[1], success: false, evidence: "Failure", confidenceAdjustment: -0.3 },
              ],
              averageAdjustment: -0.1
            }
          }
        };
      }
      return {
        overallConfidenceScore: 0.9,
        validationReport: {
          contextCheck: {
            requiredContext: ["user_profile"],
            missingContext: [],
            isContextSufficient: true,
          },
          testStepsCheck: {
            steps: [
              { step: h.testSteps[0], success: true, evidence: "Success", confidenceAdjustment: 0.1 },
              { step: h.testSteps[1], success: true, evidence: "Success", confidenceAdjustment: 0.1 },
            ],
            averageAdjustment: 0.1,
          },
        },
      };
    });

    const report = await validateHypothesis(hypothesis, mockContext);
    expect(report.overallConfidenceScore).toBeCloseTo(0.8, 2);
    expect(report.validationReport.testStepsCheck.steps[1].success).toBe(false);
    expect(report.validationReport.testStepsCheck.steps[1].confidenceAdjustment).toBe(-0.3);
  });
});