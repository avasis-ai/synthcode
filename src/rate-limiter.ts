import { setTimeout } from "timers/promises";

export class RateLimiter {
    private readonly rate: number; // requests per second
    private readonly capacity: number;
    private lastRequestTime: number;

    constructor(rate: number, capacity: number) {
        if (rate <= 0 || capacity < 0) {
            throw new Error("Rate must be positive and capacity non-negative.");
        }
        this.rate = rate;
        this.capacity = capacity;
        this.lastRequestTime = Date.now();
    }

    private calculateWaitTime(): number {
        // Time required between requests based on rate (seconds)
        const minIntervalMs = 1000 / this.rate;
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < minIntervalMs) {
            return minIntervalMs - timeSinceLastRequest;
        }
        return 0;
    }

    private consumeToken(): void {
        // In a simple fixed-window/leaky bucket approximation, we just update the time
        // to enforce the minimum interval.
        this.lastRequestTime = Date.now();
    }

    /**
     * Pauses execution until a token is available or throws if the system is overloaded
     * (though this implementation focuses on time-based throttling).
     * @returns A promise that resolves when the token is acquired.
     */
    public async acquireToken(): Promise<void> {
        const waitTimeMs = this.calculateWaitTime();

        if (waitTimeMs > 0) {
            await setTimeout(waitTimeMs);
        }

        // Simulate token consumption and update time
        this.consumeToken();
    }
}