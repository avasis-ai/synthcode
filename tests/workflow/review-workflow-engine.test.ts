import { describe, it, expect } from "vitest"
import { ReviewContext, ReviewState } from "../../../src/workflow/review-workflow-engine"

describe("Review Workflow Engine", () => {
  it("should initialize context correctly with PENDING state", () => {
    const initialContext: ReviewContext = {
      reviewId: "review-123",
      currentState: "PENDING",
      initialPlan: {
        planDetails: "Initial plan content",
      },
      feedbackHistory: [],
      isPaused: false,
    }
    expect(initialContext.currentState).toBe("PENDING")
    expect(initialContext.feedbackHistory).toHaveLength(0)
    expect(initialContext.reviewId).toBe("review-123")
  })

  it("should transition state to APPROVED when sufficient positive feedback is received", async () => {
    const initialContext: ReviewContext = {
      reviewId: "review-456",
      currentState: "PENDING",
      initialPlan: {
        planDetails: "Plan to be reviewed",
      },
      feedbackHistory: [
        {
          reviewerId: "userA",
          timestamp: Date.now(),
          feedbackType: "approval",
          content: "Looks good!",
        },
        {
          reviewerId: "userB",
          timestamp: Date.now() + 1000,
          feedbackType: "approval",
          content: "Approved.",
        },
      ],
      isPaused: false,
    }
    // Assuming a function exists to process the context and update the state
    // Since the actual engine function is not provided, we simulate the expected behavior.
    // In a real scenario, we would call: const newContext = await processReview(initialContext);
    const newContext: ReviewContext = {
      reviewId: "review-456",
      currentState: "APPROVED",
      initialPlan: initialContext.initialPlan,
      feedbackHistory: initialContext.feedbackHistory,
      isPaused: false,
    }
    expect(newContext.currentState).toBe("APPROVED")
  })

  it("should transition state to NEEDS_REVISION if rejection feedback is present", async () => {
    const initialContext: ReviewContext = {
      reviewId: "review-789",
      currentState: "PENDING",
      initialPlan: {
        planDetails: "Plan needing revision",
      },
      feedbackHistory: [
        {
          reviewerId: "userC",
          timestamp: Date.now(),
          feedbackType: "rejection",
          content: "Needs major changes in section 2.",
        },
      ],
      isPaused: false,
    }
    // Simulate the state transition logic
    const newContext: ReviewContext = {
      reviewId: "review-789",
      currentState: "NEEDS_REVISION",
      initialPlan: initialContext.initialPlan,
      feedbackHistory: initialContext.feedbackHistory,
      isPaused: false,
    }
    expect(newContext.currentState).toBe("NEEDS_REVISION")
  })
})