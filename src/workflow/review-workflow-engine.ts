export type ReviewState = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "COMPLETED";

export interface ReviewFeedback {
  reviewerId: string;
  timestamp: number;
  feedbackType: "correction" | "clarification" | "approval" | "rejection";
  content: string;
  suggestedChanges?: Record<string, unknown>;
}

export interface ReviewContext {
  reviewId: string;
  currentState: ReviewState;
  initialPlan: Record<string, unknown>;
  feedbackHistory: ReviewFeedback[];
  isPaused: boolean;
}

export class ReviewWorkflowEngine {
  private context: ReviewContext;

  constructor(initialContext: ReviewContext) {
    this.context = initialContext;
  }

  public getReviewState(): ReviewState {
    return this.context.currentState;
  }

  public getReviewContext(): ReviewContext {
    return this.context;
  }

  public initializeReview(reviewId: string, initialPlan: Record<string, unknown>): ReviewWorkflowEngine {
    this.context = {
      reviewId,
      currentState: "PENDING",
      initialPlan: initialPlan,
      feedbackHistory: [],
      isPaused: true,
    };
    return this;
  }

  public submitReview(feedback: ReviewFeedback): ReviewWorkflowEngine {
    if (this.context.currentState === "COMPLETED") {
      throw new Error("Cannot submit review: Workflow is already completed.");
    }

    this.context.feedbackHistory = [...this.context.feedbackHistory, feedback];

    if (feedback.feedbackType === "approval") {
      this.context.currentState = "APPROVED";
      this.context.isPaused = false;
    } else if (feedback.feedbackType === "rejection") {
      this.context.currentState = "REJECTED";
      this.context.isPaused = false;
    } else if (feedback.feedbackType === "correction" || feedback.feedbackType === "clarification") {
      this.context.currentState = "NEEDS_REVISION";
      this.context.isPaused = true;
    } else {
      // Default case or unhandled feedback type
      this.context.currentState = "PENDING";
    }

    return this;
  }

  public injectFeedback(feedback: ReviewFeedback): Record<string, unknown> {
    if (this.context.currentState === "PENDING") {
      throw new Error("Cannot inject feedback: Workflow is not paused and awaiting review.");
    }

    this.context.feedbackHistory = [...this.context.feedbackHistory, feedback];

    const injectedContext = {
      reviewFeedback: feedback,
      currentWorkflowState: this.context.currentState,
      reviewSummary: `Human review provided feedback: ${feedback.content}. Action required: ${feedback.feedbackType}.`,
    };

    return injectedContext;
  }

  public finalizeWorkflow(finalState: ReviewState): ReviewWorkflowEngine {
    this.context.currentState = finalState;
    this.context.isPaused = false;
    return this;
  }
}