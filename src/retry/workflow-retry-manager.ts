export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent = any;

export interface RetryAttempt {
  attemptCount: number;
  lastFailureReason: string;
  nextScheduledTime: number;
}

export class WorkflowRetryManager {
  private readonly maxAttempts: number;
  private readonly initialDelayMs: number;

  constructor(maxAttempts: number = 5, initialDelayMs: number = 1000) {
    this.maxAttempts = maxAttempts;
    this.initialDelayMs = initialDelayMs;
  }

  private calculateDelay(attemptCount: number): number {
    if (attemptCount <= 0) {
      return 0;
    }

    // Exponential Backoff: Base * 2^(attempt - 1)
    // Example: 1s, 2s, 4s, 8s...
    const exponentialDelay = this.initialDelayMs * Math.pow(2, attemptCount - 1);

    // Add Jitter (randomness) to prevent thundering herd problem
    // Jitter range: 0 to 10% of the calculated delay
    const jitter = Math.random() * (exponentialDelay * 0.1);

    let delay = exponentialDelay + jitter;

    // Cap the delay to prevent excessively long waits
    return Math.min(delay, 60000); // Max 60 seconds delay
  }

  private initializeAttemptState(): RetryAttempt {
    return {
      attemptCount: 0,
      lastFailureReason: "",
      nextScheduledTime: 0,
    };
  }

  public updateState(currentState: RetryAttempt, failureReason: string): RetryAttempt {
    const newAttemptCount = currentState.attemptCount + 1;
    const newDelay = this.calculateDelay(newAttemptCount);

    return {
      attemptCount: newAttemptCount,
      lastFailureReason: failureReason,
      nextScheduledTime: Date.now() + newDelay,
    };
  }

  /**
   * Schedules a retry execution after the calculated delay.
   * @param currentState The current state of the retry manager.
   * @param failureReason The reason for the last failure.
   * @returns A Promise that resolves after the calculated delay, simulating the retry attempt.
   */
  public scheduleRetry(currentState: RetryAttempt, failureReason: string): Promise<void> {
    if (currentState.attemptCount >= this.maxAttempts) {
      return Promise.reject(new Error("Maximum retry attempts reached. Workflow failed permanently."));
    }

    const newState = this.updateState(currentState, failureReason);
    const delayMs = newState.nextScheduledTime - Date.now();

    if (delayMs <= 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, delayMs);
    });
  }
}