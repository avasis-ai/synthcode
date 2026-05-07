import {
  AssistantMessage,
  UserMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface PlanContext {
  currentGoal: string;
  constraints: string[];
  mandatorySteps: string[];
  history: Message[];
}

export interface ReviewRequest {
  context: PlanContext;
  scope: "PLAN" | "STATE" | "GOAL";
  details: string;
}

export interface ReviewFeedback {
  reviewerId: string;
  feedbackType: "CONSTRAINT_UPDATE" | "GOAL_MODIFICATION" | "MANDATORY_STEP_ADDITION" | "GENERAL_ADVICE";
  feedbackContent: string;
  suggestedUpdates: {
    newConstraints?: string[];
    modifiedGoal?: string;
    mandatoryStepsToAdd?: string[];
  };
}

export class ExpertReviewManager {
  private context: PlanContext;

  constructor(initialContext: PlanContext) {
    this.context = initialContext;
  }

  public getContext(): PlanContext {
    return this.context;
  }

  public requestReview(scope: "PLAN" | "STATE" | "GOAL", details: string): ReviewRequest {
    const request: ReviewRequest = {
      context: {
        currentGoal: this.context.currentGoal,
        constraints: this.context.constraints,
        mandatorySteps: this.context.mandatorySteps,
        history: [...this.context.history],
      },
      scope: scope,
      details: details,
    };
    return request;
  }

  public processFeedback(feedback: ReviewFeedback): PlanContext {
    let newContext = {
      currentGoal: this.context.currentGoal,
      constraints: [...this.context.constraints],
      mandatorySteps: [...this.context.mandatorySteps],
      history: [...this.context.history],
    };

    if (feedback.feedbackType === "CONSTRAINT_UPDATE" && feedback.suggestedUpdates.newConstraints) {
      newContext.constraints = [...newContext.constraints, ...feedback.suggestedUpdates.newConstraints];
    }

    if (feedback.feedbackType === "GOAL_MODIFICATION" && feedback.suggestedUpdates.modifiedGoal) {
      newContext.currentGoal = feedback.suggestedUpdates.modifiedGoal;
    }

    if (feedback.feedbackType === "MANDATORY_STEP_ADDITION" && feedback.suggestedUpdates.mandatoryStepsToAdd) {
      newContext.mandatorySteps = [...newContext.mandatorySteps, ...feedback.suggestedUpdates.mandatoryStepsToAdd];
    }

    // Simulate updating the history with the expert review outcome
    const reviewMessage: Message = {
      role: "tool",
      tool_use_id: "expert_review",
      content: `Expert Review Incorporated: ${feedback.feedbackContent}`,
    };

    newContext.history = [...newContext.history, reviewMessage];

    return newContext;
  }
}