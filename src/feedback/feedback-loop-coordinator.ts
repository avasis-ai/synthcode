import { EventEmitter } from "events";

export type Message = { role: "user" } | { role: "assistant" } | { role: "tool" };

export interface FeedbackData {
  feedbackContent: string;
  sourceCredibility: number;
  requiredAction: "CORRECTION" | "CLARIFICATION" | "NONE" | "REPLANNING";
  iterationCount: number;
  isConflict: boolean;
}

export enum FeedbackLoopState {
  AWAITING_INPUT,
  PAUSED_FOR_REVIEW,
  REPLANNING,
  COMPLETE,
}

export type CoordinatorEvent = {
  type: "AwaitingFeedback";
  state: FeedbackLoopState;
  message: string;
  requiredInput: string;
};

export class FeedbackLoopCoordinator extends EventEmitter {
  private currentState: FeedbackLoopState;
  private lastFeedback: FeedbackData | null = null;
  private readonly MAX_ITERATIONS: number = 3;
  private readonly MIN_CREDIBILITY_FOR_ACTION: number = 0.7;

  constructor() {
    super();
    this.currentState = FeedbackLoopState.AWAITING_INPUT;
  }

  getState(): FeedbackLoopState {
    return this.currentState;
  }

  /**
   * Ingests new feedback and assesses its immediate impact on the current plan.
   * @param feedback The structured feedback data.
   * @returns A boolean indicating if the state transition occurred.
   */
  ingestFeedback(feedback: FeedbackData): boolean {
    if (feedback.iterationCount >= this.MAX_ITERATIONS) {
      console.warn("Maximum feedback iterations reached. Cannot process further feedback.");
      this.currentState = FeedbackLoopState.COMPLETE;
      return false;
    }

    this.lastFeedback = feedback;
    return this.assessImpact(feedback);
  }

  /**
   * Assesses the feedback's impact, detects conflicts, and determines the next state.
   * @param feedback The feedback to assess.
   * @returns True if a state change or event emission is required.
   */
  private assessImpact(feedback: FeedbackData): boolean {
    let requiresAction = false;

    if (feedback.isConflict && feedback.sourceCredibility >= this.MIN_CREDIBILITY_FOR_ACTION) {
      this.currentState = FeedbackLoopState.PAUSED_FOR_REVIEW;
      requiresAction = true;
    } else if (feedback.requiredAction === "REPLANNING" && feedback.sourceCredibility >= this.MIN_CREDIBILITY_FOR_ACTION) {
      this.currentState = FeedbackLoopState.REPLANNING;
      requiresAction = true;
    } else if (feedback.requiredAction === "CLARIFICATION" && feedback.sourceCredibility > 0.5) {
      this.currentState = FeedbackLoopState.AWAITING_INPUT;
      requiresAction = true;
    } else {
      this.currentState = FeedbackLoopState.AWAITING_INPUT;
    }

    if (requiresAction) {
      this.emit("stateChange", {
        newState: this.currentState,
        feedback: feedback,
      });
      return true;
    }

    return false;
  }

  /**
   * Resets the coordinator state, typically called after a successful plan execution or manual reset.
   */
  resetCoordinator(): void {
    this.currentState = FeedbackLoopState.AWAITING_INPUT;
    this.lastFeedback = null;
    this.emit("reset");
  }

  /**
   * Generates a structured event if the coordinator is paused or needs input.
   * @returns The structured event object or null if no action is needed.
   */
  generateAwaitingFeedbackEvent(): CoordinatorEvent | null {
    if (this.currentState === FeedbackLoopState.PAUSED_FOR_REVIEW ||
      this.currentState === FeedbackLoopState.AWAITING_INPUT) {
      
      const message = this.lastFeedback
        ? `Feedback received: ${this.lastFeedback.feedbackContent}. Action required: ${this.lastFeedback.requiredAction}.`
        : "Awaiting initial feedback.";

      return {
        type: "AwaitingFeedback",
        state: this.currentState,
        message: message,
        requiredInput: "User confirmation or detailed input to proceed.",
      };
    }
    return null;
  }
}

export { FeedbackLoopCoordinator };