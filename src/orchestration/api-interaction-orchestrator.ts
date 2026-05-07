import { RateLimiter } from "./rate-limiter.js";
import { RetryManager } from "./retry-manager.js";

export type ApiStepResult = {
    success: boolean;
    data: unknown;
    error?: string;
};

export interface ApiStep {
    name: string;
    endpoint: string;
    parameters: Record<string, unknown>;
    execute: (context: Record<string, unknown>) => Promise<unknown>;
    policy: {
        maxRetries: number;
        initialBackoffMs: number;
        retryStrategy: 'exponential' | 'linear';
    };
    onFailure?: (context: Record<string, unknown>, error: Error) => Promise<unknown>;
}

export class ApiInteractionOrchestrator {
    private steps: ApiStep[];
    private rateLimiter: RateLimiter;
    private retryManager: RetryManager;

    constructor(steps: ApiStep[], rateLimiter: RateLimiter, retryManager: RetryManager) {
        this.steps = steps;
        this.rateLimiter = rateLimiter;
        this.retryManager = retryManager;
    }

    private async executeStep(step: ApiStep, context: Record<string, unknown>): Promise<ApiStepResult> {
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt <= step.policy.maxRetries) {
            try {
                await this.rateLimiter.acquireToken();
                const result = await step.execute(context);
                return { success: true, data: result };
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                attempt++;

                if (attempt > step.policy.maxRetries) {
                    break;
                }

                const delay = this.calculateBackoff(attempt, step.policy.initialBackoffMs, step.policy.retryStrategy);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return { success: false, data: undefined, error: lastError?.message || "Unknown failure" };
    }

    private calculateBackoff(attempt: number, initialMs: number, strategy: 'exponential' | 'linear'): number {
        if (strategy === 'exponential') {
            return initialMs * Math.pow(2, attempt - 1);
        }
        return initialMs * attempt;
    }

    private async handleFailure(step: ApiStep, context: Record<string, unknown>, error: Error): Promise<unknown> {
        if (step.onFailure) {
            return step.onFailure(context, error);
        }
        throw new Error(`Step ${step.name} failed and no fallback handler was defined.`);
    }

    public async run(initialContext: Record<string, unknown>): Promise<Record<string, unknown>> {
        let currentContext = { ...initialContext };
        const results: Record<string, unknown> = {};

        for (const step of this.steps) {
            try {
                const result = await this.executeStep(step, currentContext);

                if (result.success) {
                    results[step.name] = result.data;
                    // Update context with successful step output
                    currentContext = { ...currentContext, [step.name]: result.data };
                } else {
                    // Handle failure
                    const error = new Error(result.error || "Execution failed");
                    console.error(`[Orchestrator] Step ${step.name} failed after retries. Attempting fallback.`);

                    try {
                        const fallbackResult = await this.handleFailure(step, currentContext, error);
                        results[step.name] = fallbackResult;
                        currentContext = { ...currentContext, [step.name]: fallbackResult };
                    } catch (fallbackError) {
                        results[step.name] = null;
                        throw new Error(`Critical failure in step ${step.name}: Initial failure (${error.message}) followed by fallback failure (${fallbackError.message})`);
                    }
                }
            } catch (e) {
                throw new Error(`Orchestration failed at step ${step.name}: ${(e as Error).message}`);
            }
        }

        return currentContext;
    }
}

// Mock implementations for required dependencies
export class RateLimiter {
    private capacity: number = 5;
    private tokens: number = 5;

    async acquireToken(): Promise<void> {
        if (this.tokens > 0) {
            this.tokens--;
            return Promise.resolve();
        }
        throw new Error("Rate limit exceeded. Try again later.");
    }
}

export class RetryManager {
    // Placeholder for advanced retry logic if needed, but the orchestrator handles the loop.
    // Keeping it simple as per the requirement structure.
}