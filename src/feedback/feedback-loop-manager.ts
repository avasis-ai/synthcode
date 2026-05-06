import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface FeedbackRequest {
  context: Message;
  reason: string;
  required_action: "correction" | "adaptation" | "confirmation";
}

export interface FeedbackHandler {
  handle(request: FeedbackRequest): Promise<string>;
}

export class FeedbackLoopManager {
  private isPaused: boolean = false;

  constructor() {}

  public pauseExecution(): void {
    this.isPaused = true;
  }

  public isPaused(): boolean {
    return this.isPaused;
  }

  public requestFeedback(context: Message, reason: string, requiredAction: "correction" | "adaptation" | "confirmation"): FeedbackRequest {
    if (!this.isPaused) {
      throw new Error("Execution must be paused before requesting feedback.");
    }
    return {
      context: context,
      reason: reason,
      required_action: requiredAction,
    };
  }

  public async applyFeedback(feedback: string): Promise<Message> {
    if (!this.isPaused) {
      throw new Error("Execution must be paused before applying feedback.");
    }

    const correctedContent: ContentBlock[] = [
      { type: "text", text: `[Feedback Applied]: ${feedback}` },
    ];

    const feedbackMessage: Message = {
      role: "tool",
      tool_use_id: "feedback_loop",
      content: feedback,
      is_error: false,
    };

    this.isPaused = false;
    return feedbackMessage;
  }

  public async processFeedbackLoop(
    context: Message,
    reason: string,
    requiredAction: "correction" | "adaptation" | "confirmation",
    handler: FeedbackHandler
  ): Promise<Message> {
    this.pauseExecution();
    
    const request = this.requestFeedback(context, reason, requiredAction);
    
    const feedback = await handler.handle(request);
    
    const resultMessage = await this.applyFeedback(feedback);
    
    return resultMessage;
  }
}