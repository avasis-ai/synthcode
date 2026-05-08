import { describe, it, expect } from "vitest";
import { ReviewCycleManager } from "../src/coordination/review-cycle-manager";

describe("ReviewCycleManager", () => {
  it("should initialize correctly with a pending state", () => {
    const manager = new ReviewCycleManager();
    expect(manager.getState()).toBe("PENDING_REVIEW");
  });

  it("should transition to AWAITING_FEEDBACK when a review is requested", () => {
    const manager = new ReviewCycleManager();
    const initialContext: Message[] = [
      { type: "user", content: "Initial draft content." },
    ];
    const reviewRequest: ReviewRequest = {
      currentState: "PENDING_REVIEW",
      context: initialContext,
      proposedPlan: "Plan A",
      reviewQuestions: ["Question 1", "Question 2"],
      instructions: "Review this draft.",
    };
    manager.processReviewRequest(reviewRequest);
    expect(manager.getState()).toBe("AWAITING_FEEDBACK");
  });

  it("should transition to APPROVED when positive feedback is received", () => {
    const manager = new ReviewCycleManager();
    // Simulate initial setup
    manager.processReviewRequest({
      currentState: "PENDING_REVIEW",
      context: [],
      proposedPlan: "",
      reviewQuestions: [],
      instructions: "",
    });
    // Simulate receiving feedback that leads to approval
    const feedback: ReviewFeedback = {
      feedback: "Looks great, ready to go!",
      suggestedPlan: "Final Plan",
      isApproved: true,
    };
    manager.processFeedback(feedback);
    expect(manager.getState()).toBe("APPROVED");
  });
});