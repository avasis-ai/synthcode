import { Message } from "./types";

export interface FallbackCondition {
  /**
   * Determines if the current step should fail over to the next step.
   * @param result The result of the current tool execution.
   * @param context The current execution context.
   * @returns true if fallback should occur, false otherwise.
   */
  shouldFallback(result: any, context: { messages: Message[] }): boolean;
}

export interface FallbackStep {
  /**
   * The tool or function to attempt execution.
   * @param context The current execution context.
   * @returns A promise that resolves with the result of the tool execution.
   */
  executeTool: (context: { messages: Message[] }) => Promise<any>;

  /**
   * The condition that must be met for this step to trigger a fallback.
   */
  condition: FallbackCondition;

  /**
   * Optional retry logic if the tool fails transiently.
   * @param attempt The current attempt number (starting from 1).
   * @returns A promise that resolves when retries are exhausted or successful.
   */
  retry?: (attempt: number, context: { messages: Message[] }) => Promise<any>;
}

export class AdaptiveToolFallbackChain {
  private readonly steps: FallbackStep[];

  constructor(steps: FallbackStep[]) {
    this.steps = steps;
  }

  public async execute(initialContext: { messages: Message[] }): Promise<any> {
    let currentContext: { messages: Message[] } = { ...initialContext };

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      try {
        let result: any;
        let attempt = 1;
        let success = false;

        while (attempt <= 1) {
          try {
            result = await step.executeTool(currentContext);
            success = true;
            break;
          } catch (error) {
            if (step.retry) {
              result = await step.retry(attempt, currentContext);
              success = true;
              break;
            }
            throw error;
          }
          attempt++;
        }

        if (!success) {
          throw new Error(`Failed to execute step ${i} after all retries.`);
        }

        // Check fallback condition
        if (step.condition.shouldFallback(result, currentContext)) {
          console.log(`Fallback triggered at step ${i}. Proceeding to next step.`);
          // Update context with the result before moving on (optional, but good practice)
          currentContext = { ...currentContext, messages: [...currentContext.messages, { role: "tool", content: JSON.stringify(result), tool_use_id: "fallback_result" } as Message] };
          continue; // Move to the next step
        } else {
          // Success and no fallback needed
          console.log(`Step ${i} succeeded without fallback. Chain execution complete.`);
          return result;
        }
      } catch (e) {
        console.error(`Step ${i} failed permanently. Attempting next step or exhausting chain.`);
        currentContext = { ...currentContext, messages: [...currentContext.messages, { role: "tool", content: `Error executing step ${i}: ${e instanceof Error ? e.message : String(e)}`, tool_use_id: "error" } as Message] };
        
        // If this was the last step, rethrow the error
        if (i === this.steps.length - 1) {
          throw new Error(`All fallback steps failed. Final error: ${e instanceof Error ? e.message : String(e)}`);
        }
        // Otherwise, the loop continues to the next step
      }
    }

    throw new Error("Fallback chain exhausted without reaching a successful termination point.");
  }
}