import { describe, it, expect } from "vitest";
import { FeedbackTriageManager, FeedbackPayload, AgentContext } from "../src/feedback/feedback-triage-manager";

describe("FeedbackTriageManager", () => {
  it("should correctly triage feedback based on severity and category", () => {
    const manager = new FeedbackTriageManager();
    const payload: FeedbackPayload = {
      raw: "The login button is broken.",
      category: "BUG",
      severity: "CRITICAL",
      priorityScore: 0.95,
    };
    const triageResult = manager.triageFeedback(payload);
    expect(triageResult.action).toBe("IMMEDIATE_ACTION");
    expect(triageResult.reason).toContain("CRITICAL BUG");
  });

  it("should assign a lower priority for low severity, non-critical feedback", () => {
    const manager = new FeedbackTriageManager();
    const payload: FeedbackPayload = {
      raw: "Could you add more examples?",
      category: "CLARITY",
      severity: "LOW",
      priorityScore: 0.3,
    };
    const triageResult = manager.triageFeedback(payload);
    expect(triageResult.action).toBe("LOW_PRIORITY_FOLLOWUP");
    expect(triageResult.reason).toContain("CLARITY");
  });

  it("should adjust triage when high priority is combined with context (e.g., performance issue)", () => {
    const manager = new FeedbackTriageManager();
    const context: AgentContext = {
      currentGoal: "Optimize API response times",
      lastToolResult: { result: "API call took 5s", toolName: "latency_checker" },
      history: [],
    };
    const payload: FeedbackPayload = {
      raw: "The API is too slow.",
      category: "PERFORMANCE",
      severity: "HIGH",
      priorityScore: 0.85,
    };
    const triageResult = manager.triageFeedbackWithContext(payload, context);
    expect(triageResult.action).toBe("URGENT_REVIEW");
    expect(triageResult.reason).toContain("PERFORMANCE");
  });
});