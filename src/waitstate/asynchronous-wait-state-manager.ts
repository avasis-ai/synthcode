import { setTimeout } from "timers/promises";

export type WaitState = {
  targetCriteria: (state: Record<string, unknown>) => boolean;
  pollingIntervalMs: number;
  timeoutMs: number;
};

export enum WaitStateStatus {
  WAITING = "WAITING",
  SUCCESS = "SUCCESS",
  TIMEOUT = "TIMEOUT",
  FAILURE = "FAILURE",
}

export class AsynchronousWaitStateManager {
  private waitState: WaitState;
  private currentState: WaitStateStatus = WaitStateStatus.WAITING;
  private lastCheckedState: Record<string, unknown> | null = null;

  constructor(waitState: WaitState) {
    this.waitState = waitState;
  }

  public getStatus(): WaitStateStatus {
    return this.currentState;
  }

  public getLastError(): Error | null {
    return null;
  }

  /**
   * Initiates the waiting process. This method should be awaited by the orchestrator.
   * It polls the external state until success, timeout, or failure.
   * @param initialState The initial state data to check against criteria.
   * @returns A Promise that resolves when the wait state is resolved.
   */
  public async awaitState(initialState: Record<string, unknown>): Promise<void> {
    this.currentState = WaitStateStatus.WAITING;
    this.lastCheckedState = initialState;

    const startTime = Date.now();

    while (this.currentState === WaitStateStatus.WAITING) {
      const elapsed = Date.now() - startTime;

      if (elapsed >= this.waitState.timeoutMs) {
        this.currentState = WaitStateStatus.TIMEOUT;
        break;
      }

      try {
        await setTimeout(this.waitState.pollingIntervalMs);

        // Simulate fetching the current external state
        const newState = await this.pollExternalSource(initialState);

        if (this.waitState.targetCriteria(newState)) {
          this.currentState = WaitStateStatus.SUCCESS;
          return;
        }

        this.lastCheckedState = newState;

      } catch (error) {
        this.currentState = WaitStateStatus.FAILURE;
        throw new Error(`Wait state polling failed: ${(error as Error).message}`);
      }
    }

    if (this.currentState === WaitStateStatus.TIMEOUT) {
      throw new Error("Wait state timed out before target criteria were met.");
    }
  }

  /**
   * Placeholder for the actual external polling mechanism.
   * In a real application, this would involve an API call or database query.
   * @param previousState The state from the previous poll.
   * @returns A Promise resolving to the current external state.
   */
  private async pollExternalSource(previousState: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simulate network delay and state change
    await setTimeout(100);

    // Simple simulation: Assume the state eventually reaches 'complete'
    const simulatedState: Record<string, unknown> = {
      status: Math.random() < 0.1 ? "complete" : "pending",
      data: {
        progress: Math.floor(Math.random() * 100)
      }
    };
    return simulatedState;
  }
}

export { AsynchronousWaitStateManager };