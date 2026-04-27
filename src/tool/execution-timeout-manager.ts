import { Message, ToolResultMessage } from "./types";

export type TimeoutResult<T> = {
  timedOut: boolean;
  result: T | null;
  fallbackExecuted: boolean;
};

export type FallbackHandler<T> = (
  context: {
    toolName: string;
    toolInput: Record<string, unknown>;
  }
) => Promise<T>;

export class ToolExecutionTimeoutManager {
  private readonly timeoutMs: number;
  private readonly fallbackHandler: FallbackHandler<any>;

  constructor(timeoutMs: number, fallbackHandler: FallbackHandler<any>) {
    this.timeoutMs = timeoutMs;
    this.fallbackHandler = fallbackHandler;
  }

  public async execute<T>(
    toolName: string,
    toolInput: Record<string, unknown>,
    toolExecutionPromise: Promise<T>
  ): Promise<TimeoutResult<T>> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Execution timed out"));
      }, this.timeoutMs);
      // Attach timeoutId to the promise context if needed, though Promise.race handles it implicitly
    });

    const racePromise = Promise.race([
      toolExecutionPromise,
      timeoutPromise,
    ]);

    try {
      const result = await racePromise;
      return {
        timedOut: false,
        result: result,
        fallbackExecuted: false,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("Execution timed out")) {
        try {
          const fallbackResult = await this.fallbackHandler({
            toolName: toolName,
            toolInput: toolInput,
          });
          return {
            timedOut: true,
            result: fallbackResult,
            fallbackExecuted: true,
          };
        } catch (fallbackError) {
          console.error(
            `Fallback handler failed for tool ${toolName}:`,
            fallbackError
          );
          return {
            timedOut: true,
            result: null,
            fallbackExecuted: false,
          };
        }
      }
      // Re-throw unexpected errors
      throw error;
    }
  }
}