enum ServiceState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    DEGRADED = "DEGRADED",
}

type Policy<T> = (
    serviceCall: () => Promise<T>;
    fallback: () => Promise<T>;
): Promise<T>;

interface ServiceMetrics {
    failureCount: number;
    lastFailureTime: number | null;
    state: ServiceState;
}

export class ServiceDegradationPolicyManager {
    private metrics: ServiceMetrics;
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;

    constructor(failureThreshold: number = 5, resetTimeoutMs: number = 30000) {
        this.metrics = {
            failureCount: 0,
            lastFailureTime: null,
            state: ServiceState.CLOSED,
        };
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    private checkState(isSuccess: boolean): void {
        if (isSuccess) {
            this.metrics.failureCount = 0;
            this.metrics.lastFailureTime = null;
            if (this.metrics.state !== ServiceState.CLOSED) {
                this.metrics.state = ServiceState.CLOSED;
            }
            return;
        }

        this.metrics.failureCount++;
        this.metrics.lastFailureTime = Date.now();

        if (this.metrics.state === ServiceState.CLOSED && this.metrics.failureCount >= this.failureThreshold) {
            this.metrics.state = ServiceState.OPEN;
        } else if (this.metrics.state === ServiceState.OPEN && (Date.now() - (this.metrics.lastFailureTime || 0) > this.resetTimeoutMs)) {
            this.metrics.state = ServiceState.DEGRADED;
        } else if (this.metrics.state === ServiceState.DEGRADED && this.metrics.failureCount >= this.failureThreshold * 2) {
             this.metrics.state = ServiceState.OPEN;
        }
    }

    private getExponentialBackoffDelay(attempt: number): number {
        return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    }

    private async executeWithRetries(serviceCall: () => Promise<any>, maxRetries: number = 3): Promise<any> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await serviceCall();
                return result;
            } catch (error) {
                if (attempt < maxRetries) {
                    const delay = this.getExponentialBackoffDelay(attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }
        throw new Error("Max retries exceeded.");
    }

    public async executePolicy(policy: Policy<any>): Promise<any> {
        const currentState = this.metrics.state;

        if (currentState === ServiceState.OPEN) {
            return policy.fallback();
        }

        try {
            let result: any;
            
            if (currentState === ServiceState.DEGRADED) {
                result = await this.executeWithRetries(policy.serviceCall);
            } else {
                result = await this.executeWithRetries(policy.serviceCall);
            }

            this.checkState(true);
            return result;

        } catch (error) {
            this.checkState(false);

            if (this.metrics.state === ServiceState.OPEN || this.metrics.state === ServiceState.DEGRADED) {
                return policy.fallback();
            }
            
            throw error;
        }
    }
}