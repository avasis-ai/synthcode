export enum ServiceState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN",
}

export class ServiceAvailabilityGate {
    private state: ServiceState = ServiceState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;

    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;
    private readonly halfOpenSuccessThreshold: number;

    constructor(
        failureThreshold: number = 5,
        resetTimeoutMs: number = 30000,
        halfOpenSuccessThreshold: number = 3
    ) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.halfOpenSuccessThreshold = halfOpenSuccessThreshold;
    }

    private checkTimeout(): boolean {
        const now = Date.now();
        if (this.state === ServiceState.OPEN && (now - this.lastFailureTime) >= this.resetTimeoutMs) {
            this.state = ServiceState.HALF_OPEN;
            return true;
        }
        return false;
    }

    public check(): void {
        if (this.state === ServiceState.OPEN) {
            if (this.checkTimeout()) {
                // Transitioned to HALF_OPEN, proceed
            } else {
                throw new Error("ServiceAvailabilityGate is OPEN. Service is currently unavailable.");
            }
        }
        // If CLOSED or HALF_OPEN, proceed
    }

    public recordSuccess(): void {
        if (this.state === ServiceState.CLOSED) {
            this.failureCount = 0;
            this.successCount++;
        } else if (this.state === ServiceState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.halfOpenSuccessThreshold) {
                this.state = ServiceState.CLOSED;
                this.failureCount = 0;
                this.successCount = 0;
            }
        } else if (this.state === ServiceState.OPEN) {
            // Should not happen if check() is called first, but reset just in case
            this.state = ServiceState.CLOSED;
        }
    }

    public recordFailure(): void {
        this.lastFailureTime = Date.now();

        if (this.state === ServiceState.CLOSED) {
            this.failureCount++;
            this.successCount = 0;
            if (this.failureCount >= this.failureThreshold) {
                this.state = ServiceState.OPEN;
            }
        } else if (this.state === ServiceState.HALF_OPEN) {
            this.state = ServiceState.OPEN;
            this.failureCount = 0;
            this.successCount = 0;
        }
        // If OPEN, state remains OPEN
    }

    public getState(): ServiceState {
        return this.state;
    }

    public getFailureRate(): number {
        const totalAttempts = this.failureCount + this.successCount;
        if (totalAttempts === 0) {
            return 0;
        }
        return this.failureCount / totalAttempts;
    }
}

export { ServiceState, ServiceAvailabilityGate };