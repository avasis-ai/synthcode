export type PollingFunction = (attempt: number) => Promise<ResourceState>;

export type ResourceState = {
  status: "SUCCESS" | "FAILURE" | "IN_PROGRESS";
  result?: any;
  error?: Error;
};

export class AsyncPollingManager {
  constructor() {}

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Waits for an external resource to reach a final state (SUCCESS or FAILURE).
   * Implements exponential backoff with jitter.
   *
   * @param pollingFn The function that checks the resource status. It receives the current attempt number.
   * @param initialDelayMs The starting delay in milliseconds.
   * @param maxAttempts The maximum number of times to poll.
   * @returns A promise that resolves with the final result if successful, or rejects with the error if failed or timed out.
   */
  public async waitForResource(
    pollingFn: PollingFunction,
    initialDelayMs: number,
    maxAttempts: number
  ): Promise<any> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      try {
        const state = await pollingFn(attempt);

        if (state.status === "SUCCESS") {
          return state.result;
        }

        if (state.status === "FAILURE") {
          const error = state.error || new Error("Resource failed to process.");
          throw error;
        }

        // Status is IN_PROGRESS, proceed to wait
        attempt++;

        if (attempt >= maxAttempts) {
          throw new Error("Polling failed: Maximum attempts reached.");
        }

        // Calculate delay: Exponential backoff (2^attempt * initialDelay) + Jitter
        // Jitter adds randomness to prevent thundering herd problem.
        const exponentialDelay = Math.pow(2, attempt) * initialDelayMs;
        const jitter = Math.random() * initialDelayMs;
        const delay = Math.min(exponentialDelay + jitter, 60000); // Cap delay at 60 seconds

        await AsyncPollingManager.sleep(Math.round(delay));

      } catch (e) {
        lastError = e as Error;
        // If the error is not a polling failure, we might want to retry immediately or fail fast.
        // For simplicity, we treat all caught errors as failures for the current attempt.
        if (attempt + 1 >= maxAttempts) {
          throw lastError;
        }
        attempt++;
        // Wait before retrying after a caught exception
        await AsyncPollingManager.sleep(initialDelayMs);
      }
    }

    throw lastError || new Error("Polling failed after all attempts.");
  }
}

export { AsyncPollingManager };