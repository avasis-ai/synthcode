import { EventEmitter } from "node:events";

type PollingFunction<T> = (attempt: number) => Promise<T | null>;

export class PollingService {
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Waits for a specified duration.
   * @param ms Milliseconds to wait.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Polls an asynchronous function until a condition is met or max attempts are reached.
   * Applies exponential backoff on failure.
   *
   * @param pollingFn The function to call repeatedly. It should return null or a specific value upon success.
   * @param initialDelayMs The starting delay in milliseconds.
   * @param maxAttempts The maximum number of times to attempt polling.
   * @param successCondition A function that determines if the result indicates success.
   * @returns A promise that resolves with the successful result.
   * @throws Error if the polling fails after all attempts.
   */
  public async pollUntil<T>(
    pollingFn: PollingFunction<T>,
    initialDelayMs: number,
    maxAttempts: number,
    successCondition: (result: T) => boolean
  ): Promise<T> {
    let currentAttempt = 0;
    let currentDelay = initialDelayMs;

    while (currentAttempt < maxAttempts) {
      try {
        const result = await pollingFn(currentAttempt);

        if (result === null) {
          throw new Error("Polling function returned null, treating as failure.");
        }

        if (successCondition(result)) {
          return result;
        }
      } catch (error) {
        // If the polling function throws an error, we treat it as a failure.
      }

      currentAttempt++;

      if (currentAttempt >= maxAttempts) {
        break;
      }

      console.log(`Polling failed on attempt ${currentAttempt}. Waiting ${currentDelay}ms before retrying...`);
      await this.delay(currentDelay);

      // Exponential backoff: delay = initialDelay * 2^attempt
      currentDelay = initialDelayMs * Math.pow(2, currentAttempt);
    }

    throw new Error(`Polling failed after ${maxAttempts} attempts.`);
  }
}

export { PollingService };