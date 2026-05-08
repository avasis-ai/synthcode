import { describe, it, expect, vi } from "vitest";
import { FeedbackLoopCoordinator, FeedbackData, FeedbackLoopState } from "../../../src/feedback/feedback-loop-coordinator";

describe("FeedbackLoopCoordinator", () => {
  it("should initialize with the correct state and event emitter", () => {
    const coordinator = new FeedbackLoopCoordinator();
    expect(coordinator.state).toBe(FeedbackLoopState.AWAITING_INPUT);
    expect(typeof coordinator.emit).toBe("function");
  });

  it("should transition to PAUSED_FOR_REVIEW when feedback is received and requires action", () => {
    const coordinator = new FeedbackLoopCoordinator();
    const feedback: FeedbackData = {
      feedbackContent: "The tone was too aggressive.",
      sourceCredibility: 0.9,
      requiredAction: "CORRECTION",
      iterationCount: 1,
      isConflict: false,
    };
    coordinator.processFeedback(feedback);
    expect(coordinator.state).toBe(FeedbackLoopState.PAUSED_FOR_REVIEW);
  });

  it("should transition to REPLANNING when feedback indicates a major conflict or required replanning", () => {
    const coordinator = new FeedbackLoopCoordinator();
    const feedback: FeedbackData = {
      feedbackContent: "The core premise is flawed.",
      sourceCredibility: 0.8,
      requiredAction: "REPLANNING",
      iterationCount: 2,
      isConflict: true,
    };
    coordinator.processFeedback(feedback);
    expect(coordinator.state).toBe(FeedbackLoopState.REPLANNING);
  });
});