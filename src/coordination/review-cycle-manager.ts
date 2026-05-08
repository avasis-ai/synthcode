import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

type ReviewCycleState =
  | "PENDING_REVIEW"
  | "AWAITING_FEEDBACK"
  | "REJECTED"
  | "APPROVED";

interface ReviewRequest {
  currentState: ReviewCycleState;
  context: Message[];
  proposedPlan: string;
  reviewQuestions: string[];
  instructions: string;
}

interface ReviewFeedback {
  feedbackType: "CORRECTION" | "CLARIFICATION" | "APPROVAL" | "REJECTION";
  feedbackContent: string;
  suggestedContextAdjustment?: string;
}

export class ReviewCycleManager {
  private state: ReviewCycleState;
  private context: Message[];
  private currentPlan: string;

  constructor(initialContext: Message[], initialPlan: string) {
    this.state = "PENDING_REVIEW";
    this.context = initialContext;
    this.currentPlan = initialPlan;
  }

  public getState(): ReviewCycleState {
    return this.state;
  }

  public getContext(): Message[] {
    return this.context;
  }

  public startReview(): ReviewRequest {
    if (this.state !== "PENDING_REVIEW") {
      throw new Error(
        `Cannot start review. Current state is ${this.state}. Must be PENDING_REVIEW.`
      );
    }

    this.state = "AWAITING_FEEDBACK";
    return this.generateReviewRequest();
  }

  public generateReviewRequest(): ReviewRequest {
    const reviewQuestions: string[] = [
      "Does the proposed plan accurately address the user's core need?",
      "Are there any factual errors or missing context?",
      "What specific adjustments are required before proceeding?",
    ];

    return {
      currentState: this.state,
      context: [...this.context],
      proposedPlan: this.currentPlan,
      reviewQuestions: reviewQuestions,
      instructions:
        "Please review the agent's proposed plan and context. Provide structured feedback to allow the agent to refine its approach or proceed.",
    };
  }

  public processFeedback(feedback: ReviewFeedback): {
    success: boolean;
    newContext: Message[];
    newState: ReviewCycleState;
  } {
    if (this.state !== "AWAITING_FEEDBACK") {
      return {
        success: false,
        newContext: [...this.context],
        newState: this.state,
      };
    }

    let newContext = [...this.context];
    let newState: ReviewCycleState = this.state;

    switch (feedback.feedbackType) {
      case "APPROVAL":
        newContext.push({
          role: "user",
          content: [{ type: "text", text: "Review Approved." }],
        } as UserMessage);
        newState = "APPROVED";
        break;
      case "REJECTION":
        newContext.push({
          role: "user",
          content: [{ type: "text", text: "Review Rejected. Please revise." }],
        } as UserMessage);
        newState = "REJECTED";
        break;
      case "CORRECTION":
      case "CLARIFICATION":
        const adjustmentMessage: Message = {
          role: "user",
          content: [{ type: "text", text: `[HUMAN FEEDBACK: ${feedback.feedbackType}] ${feedback.feedbackContent}` }],
        } as UserMessage;

        if (feedback.suggestedContextAdjustment) {
          newContext.push({
            role: "tool",
            tool_use_id: "manual_adjustment",
            content: feedback.suggestedContextAdjustment,
          } as ToolResultMessage);
        }
        newContext.push(adjustmentMessage);
        newState = "PENDING_REVIEW"; // Cycle restarts for revision
        break;
    }

    this.context = newContext;
    this.state = newState;

    return {
      success: true,
      newContext: newContext,
      newState: newState,
    };
  }
}