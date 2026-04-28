import { Message, ToolResultMessage } from "./types";

type ErrorType = "Timeout" | "RateLimit" | "InternalError" | "Unknown";

interface FallbackCriteria {
  onErrorType: ErrorType;
  // Add other criteria like context matching, etc.
}

export interface FallbackStep {
  criteria: FallbackCriteria;
  fallbackTool: (context: { lastError: ErrorType; message: Message }) => Promise<any>;
}

export class AdaptiveFallbackChain {
  private readonly steps: FallbackStep[];

  constructor(steps: FallbackStep[]) {
    this.steps = steps;
  }

  private getErrorTypeFromError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    if (message.includes("timeout")) {
      return "Timeout";
    }
    if (message.includes("rate limit")) {
      return "RateLimit";
    }
    if (message.includes("internal")) {
      return "InternalError";
    }
    return "Unknown";
  }

  public async execute(
    primaryAction: () => Promise<any>,
    context: { lastError: Error | null; message: Message }
  ): Promise<any> {
    try {
      return await primaryAction();
    } catch (error) {
      const lastError = error instanceof Error ? error : new Error("Unknown execution error");
      const errorType = this.getErrorTypeFromError(lastError);

      const fallbackContext = {
        lastError: errorType,
        message: context.message,
      };

      for (const step of this.steps) {
        if (step.criteria.onErrorType === errorType) {
          return await step.fallbackTool(fallbackContext);
        }
      }

      throw new Error(`No suitable fallback found for error type: ${errorType}`);
    }
  }
}