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

export class SyncTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncTimeoutError";
  }
}

export interface SyncObservation {
  state: any;
  message: string;
}

export interface SyncGoal<T> {
  /**
   * The function that polls the external state.
   * It must return a Promise<T> representing the current state.
   */
  pollState: () => Promise<T>;

  /**
   * The condition checker. Returns true when synchronization is complete.
   */
  isComplete: (state: T) => boolean;

  /**
   * Optional function to transform the raw state into a user-friendly observation.
   */
  createObservation?: (state: T) => SyncObservation;
}

export class ExternalStateSynchronizer {
  private readonly initialDelayMs: number;
  private readonly maxAttempts: number;

  constructor(initialDelayMs: number = 500, maxAttempts: number = 10) {
    this.initialDelayMs = initialDelayMs;
    this.maxAttempts = maxAttempts;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async *synchronize<T>(goal: SyncGoal<T>): AsyncGenerator<SyncObservation> {
    let attempt = 0;
    let currentDelay = this.initialDelayMs;

    while (attempt < this.maxAttempts) {
      try {
        const state = await goal.pollState();

        if (goal.isComplete(state)) {
          if (goal.createObservation) {
            yield goal.createObservation(state);
          } else {
            yield { state: state, message: "Synchronization complete." };
          }
          return;
        }

        if (goal.createObservation) {
          yield goal.createObservation(state);
        } else {
          yield { state: state, message: `Polling state... Attempt ${attempt + 1}` };
        }

        attempt++;
        await this.sleep(currentDelay);
        currentDelay = Math.min(currentDelay * 2, 30000);

      } catch (error) {
        attempt++;
        console.error(`Synchronization attempt ${attempt} failed:`, error);

        if (attempt >= this.maxAttempts) {
          throw new SyncTimeoutError(`Failed to synchronize state after ${this.maxAttempts} attempts.`);
        }

        await this.sleep(currentDelay);
        currentDelay = Math.min(currentDelay * 2, 30000);
      }
    }

    throw new SyncTimeoutError(`Failed to synchronize state after ${this.maxAttempts} attempts.`);
  }
}