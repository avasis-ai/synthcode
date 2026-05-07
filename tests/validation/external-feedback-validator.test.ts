import { describe, it, expect } from "vitest";
import { validateFeedbackPayload, validateAgentContext } from "../src/validation/external-feedback-validator";

describe("External Feedback Validator", () => {
  it("should validate a correctly structured feedback payload", () => {
    const payload = {
      source: "user_input",
      suggested_change: "Please rephrase the last paragraph.",
      confidence_score: 0.85,
    };
    expect(validateFeedbackPayload(payload)).toBe(true);
  });

  it("should return false for a feedback payload missing required fields", () => {
    const payload = {
      source: "user_input",
      suggested_change: "",
      confidence_score: 0,
    };
    // Assuming the validator checks for non-empty source and suggested_change
    expect(validateFeedbackPayload(payload)).toBe(false);
  });

  it("should validate agent context with all required properties", () => {
    const context = {
      current_goal: "Write a summary of the meeting.",
      safety_policies: {
        "PII_CHECK": "Always mask names.",
        "HARASSMENT_CHECK": "Avoid inflammatory language.",
      },
      history: [],
      state: {
        user_id: "u123",
        session_count: 1,
      },
    };
    expect(validateAgentContext(context)).toBe(true);
  });
});