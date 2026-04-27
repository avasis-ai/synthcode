import { Message } from "./types";

export type TimeoutResult<T> = {
  timedOut: boolean;
  result: T | null;
  fallbackExecuted: boolean;
};

export class TimeoutManager {
  private readonly timeoutMs: number;
  private readonly fallback: () => Promise<any>;

  constructor(timeoutMs: number, fallback: () => Promise<any>) {
    this.timeoutMs = timeoutMs;
    this.fallback = fallback;
  }

  public async execute<T>(
    toolPromise: Promise<T>
  ): Promise<TimeoutResult<T>> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout"));
      }, this.timeoutMs);

      // Attach cleanup to the timeout promise rejection path
      (timeoutPromise as any)._cleanup = () => clearTimeout(timeoutId);
    });

    const racePromise = Promise.race([
      toolPromise,
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
      if (error instanceof Error && error.message === "Timeout") {
        const fallbackResult = await this.fallback();
        return {
          timedOut: true,
          result: null,
          fallbackExecuted: true,
        };
      }
      // Re-throw other errors
      throw error;
    }
  }
}