import { EventEmitter } from "node:events";

interface SchedulerConfig {
  rateLimitPerSecond: number;
  minDelayMs: number;
}

export class ServiceCallScheduler {
  private config: SchedulerConfig;
  private _lastCallTime: number = 0;
  private _callCount: number = 0;
  private _windowStartTime: number = 0;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this._windowStartTime = Date.now();
  }

  private calculateWaitTime(): number {
    const now = Date.now();
    let requiredWait = 0;

    // 1. Rate Limit Check
    const windowDuration = 1000;
    const maxCalls = this.config.rateLimitPerSecond;
    const timeSinceWindowStart = now - this._windowStartTime;

    if (timeSinceWindowStart >= windowDuration) {
      // Window reset
      this._windowStartTime = now;
      this._callCount = 0;
    }

    const callsRemaining = maxCalls - this._callCount;
    if (callsRemaining <= 0) {
      // Calculate time until the next slot opens
      const timePassedInWindow = now - this._windowStartTime;
      const timeToWait = windowDuration - timePassedInWindow;
      requiredWait = Math.max(requiredWait, timeToWait);
    } else {
      // Rate limit allows immediate call, but we still need to account for minimum spacing
    }

    // 2. Minimum Delay Check
    const minDelayWait = this.config.minDelayMs - (now - this._lastCallTime);
    
    // The required wait is the maximum of the rate limit wait and the minimum delay wait
    return Math.max(requiredWait, minDelayWait);
  }

  private async waitForWaitTime(waitMs: number): Promise<void> {
    if (waitMs > 0) {
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  /**
   * Executes a function (representing an external API call) only when the scheduler permits it.
   * @param call The asynchronous function to execute.
   * @returns A promise resolving with the result of the call.
   */
  public async execute<T>(call: () => Promise<T>): Promise<T> {
    const waitTime = this.calculateWaitTime();

    await this.waitForWaitTime(waitTime);

    // Execute the call
    const result = await call();

    // Update state
    this._lastCallTime = Date.now();
    this._callCount++;

    // If the rate limit window has passed, reset the window state
    const windowDuration = 1000;
    if (Date.now() - this._windowStartTime >= windowDuration) {
        this._windowStartTime = Date.now();
        this._callCount = 0;
    }
    
    return result;
  }
}