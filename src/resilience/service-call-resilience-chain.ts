import { setTimeout } from "timers/promises";

export type ServiceCallResult<T> = {
    result: T;
    metrics: ResilienceMetrics;
};

export interface ResilienceConfig {
    maxRetries: number;
    initialBackoffMs: number;
    backoffMultiplier: number;
}

export interface ResilienceMetrics {
    attempts: number;
    success: boolean;
    totalDurationMs: number;
    failureReason?: string;
}

export interface RateLimiter {
    checkLimit(): Promise<void>;
}

export interface SLOValidator<T> {
    validate(result: T): Promise<void>;
}

export class ServiceCallResilienceChain<T> {
    private readonly serviceCall: () => Promise<T>;
    private readonly config: ResilienceConfig;
    private readonly rateLimiter: RateLimiter;
    private readonly sloValidator: SLOValidator<T>;

    constructor(
        serviceCall: () => Promise<T>,
        config: ResilienceConfig,
        rateLimiter: RateLimiter,
        sloValidator: SLOValidator<T>
    ) {
        this.serviceCall = serviceCall;
        this.config = config;
        this.rateLimiter = rateLimiter;
        this.sloValidator = sloValidator;
    }

    private calculateBackoff(attempt: number): number {
        return this.config.initialBackoffMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    }

    private async preCallChecks(): Promise<void> {
        await this.rateLimiter.checkLimit();
    }

    private async postCallValidation(result: T): Promise<void> {
        await this.sloValidator.validate(result);
    }

    public async execute(): Promise<ServiceCallResult<T>> {
        let lastError: Error | null = null;
        let attempts = 0;
        let totalDurationMs = 0;

        for (attempts = 0; attempts <= this.config.maxRetries; attempts++) {
            const startTime = process.hrtime.bigint();
            let success = false;
            let result: T | null = null;

            try {
                await this.preCallChecks();
                result = await this.serviceCall();
                await this.postCallValidation(result);
                success = true;
                break;
            } catch (e) {
                lastError = e instanceof Error ? e : new Error(String(e));
                if (attempts < this.config.maxRetries) {
                    const backoffTime = this.calculateBackoff(attempts + 1);
                    await setTimeout(backoffTime);
                }
            } finally {
                const endTime = process.hrtime.bigint();
                const durationNs = endTime - startTime;
                totalDurationMs += Number(durationNs) / 1_000_000;
            }
        }

        const metrics: ResilienceMetrics = {
            attempts: attempts + 1,
            success: success,
            totalDurationMs: totalDurationMs,
            failureReason: lastError ? lastError.message : undefined,
        };

        if (!success) {
            throw new Error(`Service call failed after ${attempts} attempts. Last error: ${metrics.failureReason}`);
        }

        return {
            result: result!,
            metrics: metrics,
        };
    }
}