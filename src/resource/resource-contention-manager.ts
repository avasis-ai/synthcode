class ResourceContentionManager {
    private circuitOpenUntil: number = 0;
    private failureCount: number = 0;
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;

    constructor(failureThreshold: number = 5, resetTimeoutMs: number = 60000) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    private isCircuitOpen(currentTime: number): boolean {
        return currentTime < this.circuitOpenUntil;
    }

    private recordFailure(): void {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.circuitOpenUntil = Date.now() + this.resetTimeoutMs;
            console.warn("Circuit opened due to excessive failures.");
        }
    }

    private recordSuccess(): void {
        this.failureCount = 0;
        this.circuitOpenUntil = 0;
    }

    private calculateDelay(attempt: number, initialDelayMs: number, jitterFactor: number): number {
        // Exponential backoff: base * 2^(attempt - 1)
        const exponentialDelay = initialDelayMs * Math.pow(2, attempt - 1);
        
        // Add jitter: random value between 0 and jitterFactor * exponentialDelay
        const jitter = Math.random() * jitterFactor * exponentialDelay;
        
        return Math.min(exponentialDelay + jitter, 60000); // Cap delay at 60 seconds
    }

    /**
     * Executes an asynchronous function with contention protection (retries, backoff, circuit breaking).
     * @param asyncFunction The function to execute (must return a Promise).
     * @param maxRetries Maximum number of retries allowed.
     * @param initialBackoffMs The starting delay for backoff.
     * @param jitterFactor Multiplier for random jitter.
     * @param isContentionError A function to determine if an error warrants a retry (e.g., checking status codes).
     */
    public async executeWithContentionProtection<T>(
        asyncFunction: () => Promise<T>,
        maxRetries: number,
        initialBackoffMs: number,
        jitterFactor: number,
        isContentionError: (error: any) => boolean
    ): Promise<T> {
        let attempt = 1;
        const maxAttempts = maxRetries + 1;

        while (attempt <= maxAttempts) {
            const currentTime = Date.now();

            if (this.isCircuitOpen(currentTime)) {
                throw new Error("Resource contention manager: Circuit is open. Too many recent failures.");
            }

            try {
                const result = await asyncFunction();
                this.recordSuccess();
                return result;
            } catch (error) {
                const isContention = isContentionError(error);

                if (!isContention || attempt >= maxAttempts) {
                    this.recordFailure();
                    throw error; // Permanent failure or max retries reached
                }

                this.recordFailure();

                const delay = this.calculateDelay(attempt, initialBackoffMs, jitterFactor);
                console.warn(`Contention detected. Retrying in ${delay.toFixed(0)}ms. Attempt ${attempt}/${maxAttempts}.`);

                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        }
        // Should be unreachable if maxAttempts logic is correct, but included for safety
        throw new Error("Exceeded maximum retries and failed to execute.");
    }
}

export { ResourceContentionManager };