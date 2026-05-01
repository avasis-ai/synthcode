import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV16 } from "../src/context/contextual-state-diffing-v16";

describe("ContextualStateDiffingV16", () => {
  it("should correctly calculate the diff summary for a simple state change", () => {
    const initialContext = {
      user_focus_area: "billing",
      session_history_length: 5,
      current_user_intent: "check_invoice",
    };
    const updatedContext = {
      user_focus_area: "billing",
      session_history_length: 6,
      current_user_intent: "check_invoice",
    };
    const diff = ContextualStateDiffingV16.calculateDiff(initialContext, updatedContext);
    expect(diff.diff_summary).toContain("session_history_length increased");
    expect(diff.diff_summary).toContain("user_focus_area remained");
  });

  it("should handle significant changes in user intent and focus area", () => {
    const initialContext = {
      user_focus_area: "onboarding",
      session_history_length: 2,
      current_user_intent: "setup_account",
    };
    const updatedContext = {
      user_focus_area: "api_integration",
      session_history_length: 2,
      current_user_intent: "generate_api_key",
    };
    const diff = ContextualStateDiffingV16.calculateDiff(initialContext, updatedContext);
    expect(diff.diff_summary).toContain("user_focus_area changed from onboarding to api_integration");
    expect(diff.diff_summary).toContain("current_user_intent changed from setup_account to generate_api_key");
  });

  it("should return a minimal diff summary when context remains largely unchanged", () => {
    const initialContext = {
      user_focus_area: "support",
      session_history_length: 10,
      current_user_intent: "troubleshoot_login",
    };
    const updatedContext = {
      user_focus_area: "support",
      session_history_length: 10,
      current_user_intent: "troubleshoot_login",
    };
    const diff = ContextualStateDiffingV16.calculateDiff(initialContext, updatedContext);
    expect(diff.diff_summary).toBe("No significant contextual changes detected.");
  });
});