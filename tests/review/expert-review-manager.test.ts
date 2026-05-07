import { describe, it, expect, vi } from "vitest";
import { ExpertReviewManager, PlanContext, ReviewRequest, ReviewFeedback } from "../src/review/expert-review-manager";

describe("ExpertReviewManager", () => {
  it("should initialize correctly with default values", () => {
    const manager = new ExpertReviewManager();
    expect(manager).toBeDefined();
    // Assuming the constructor sets up internal state or methods
  });

  it("should process a review request for PLAN scope and generate feedback", async () => {
    const mockContext: PlanContext = {
      currentGoal: "Book a flight to London",
      constraints: ["Must be under $1000"],
      mandatorySteps: ["Search flights", "Book ticket"],
      history: [],
    };
    const mockRequest: ReviewRequest = {
      context: mockContext,
      scope: "PLAN",
      details: "The current plan seems too complex.",
    };

    // Mock the internal AI call or dependency if necessary
    // For this test, we assume the method exists and handles the logic.
    const manager = new ExpertReviewManager();
    const feedback = await manager.reviewPlan(mockRequest);

    expect(feedback).toBeDefined();
    // Check if the feedback structure is correct (assuming it returns ReviewFeedback)
    expect((feedback as ReviewFeedback).reviewerId).toBe("expert-reviewer");
  });

  it("should handle review requests for GOAL scope and suggest modifications", async () => {
    const mockContext: PlanContext = {
      currentGoal: "Book a flight to London",
      constraints: ["Must be under $1000"],
      mandatorySteps: [],
      history: [],
    };
    const mockRequest: ReviewRequest = {
      context: mockContext,
      scope: "GOAL",
      details: "The goal is too vague. We need to specify dates.",
    };

    const manager = new ExpertReviewManager();
    const feedback = await manager.reviewGoal(mockRequest);

    expect(feedback).toBeDefined();
    // Check if the feedback type suggests a GOAL_MODIFICATION
    expect((feedback as ReviewFeedback).feedbackType).toBe("GOAL_MODIFICATION");
  });
});