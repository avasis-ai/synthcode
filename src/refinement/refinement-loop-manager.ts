import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface FeedbackPayload {
  critique: string;
  requiredAction: "re-run step" | "add context" | "modify plan" | "complete";
  confidenceScore: number;
  details: Record<string, any>;
}

export interface RefinementState {
  originalPlan: Message[];
  currentIteration: number;
  accumulatedFeedback: FeedbackPayload[];
  currentContext: string;
}

export class RefinementLoopManager {
  private state: RefinementState;

  constructor(originalPlan: Message[]) {
    this.state = {
      originalPlan: originalPlan,
      currentIteration: 0,
      accumulatedFeedback: [],
      currentContext: "",
    };
  }

  public getState(): RefinementState {
    return this.state;
  }

  public processFeedback(feedback: FeedbackPayload): { newState: RefinementState; needsRevision: boolean } {
    if (feedback.confidenceScore < 0.5) {
      return { newState: this.state, needsRevision: false };
    }

    this.state.currentIteration += 1;
    this.state.accumulatedFeedback.push(feedback);

    const needsRevision = feedback.requiredAction !== "complete";

    // Simulate context diffing and state update
    const newContext = this.calculateContextDiff(feedback);
    this.state.currentContext = newContext;

    return {
      newState: { ...this.state, currentIteration: this.state.currentIteration, accumulatedFeedback: [...this.state.accumulatedFeedback], currentContext: newContext },
      needsRevision: needsRevision,
    };
  }

  private calculateContextDiff(feedback: FeedbackPayload): string {
    let diff = `[Feedback Iteration ${this.state.currentIteration}]: `;
    diff += `Critique: ${feedback.critique}. `;
    diff += `Action Required: ${feedback.requiredAction}. `;
    diff += `Confidence: ${feedback.confidenceScore.toFixed(2)}. `;
    diff += `Details: ${JSON.stringify(feedback.details)}`;
    return diff;
  }

  public generateRevisedPlan(feedback: FeedbackPayload): Message[] {
    if (feedback.requiredAction === "complete") {
      return []; // Signal completion, no plan needed
    }

    const revisedPlan: Message[] = [];
    const originalPlan = this.state.originalPlan;

    if (feedback.requiredAction === "add context") {
      const contextMessage: Message = { role: "user", content: `Please incorporate the following context: ${feedback.details.new_context || "N/A"}` };
      revisedPlan.push(contextMessage);
    }

    if (feedback.requiredAction === "re-run step") {
      const stepIndex = parseInt(feedback.details.step_index || "0");
      if (!isNaN(stepIndex) && stepIndex < originalPlan.length) {
        const originalStep: Message = originalPlan[stepIndex];
        const revisedStep: Message = { role: "user", content: `Re-run step ${stepIndex} based on feedback: ${feedback.critique}. Original content: ${originalStep.content}` };
        revisedPlan.push(revisedStep);
      }
    }

    if (feedback.requiredAction === "modify plan") {
      const modification: Message = { role: "user", content: `Modify the overall plan based on feedback: ${feedback.critique}. Focus on: ${feedback.details.focus_area || "general improvement"}` };
      revisedPlan.push(modification);
    }

    return revisedPlan;
  }
}