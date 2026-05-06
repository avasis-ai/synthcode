import { Message } from "./types";

export type FailureReason = "SCHEMA_MISMATCH" | "RESOURCE_EXHAUSTION" | "API_RATE_LIMIT" | "TOOL_FAILURE" | "UNKNOWN";

export interface FailureContext {
    error: Error;
    reason: FailureReason;
    current_state: Record<string, unknown>;
    attempted_action: string;
    message_history: Message[];
}

export interface FallbackStrategy {
    name: string;
    /**
     * Scores how well this strategy fits the given failure context. Higher score is better.
     * @param context The detailed context of the failure.
     * @returns A score (number) and a justification string.
     */
    score(context: FailureContext): { score: number; justification: string };
    /**
     * Executes the fallback logic.
     * @param context The failure context.
     * @returns A promise resolving to the suggested alternative action or path.
     */
    execute(context: FailureContext): Promise<string>;
}

export class ContextualFallbackStrategyManager {
    private strategies: FallbackStrategy[] = [];

    constructor() {}

    registerStrategy(strategy: FallbackStrategy): void {
        this.strategies.push(strategy);
    }

    /**
     * Analyzes the context and selects the best strategy based on scoring.
     * @param context The failure context.
     * @returns The best matching strategy.
     */
    private selectBestStrategy(context: FailureContext): FallbackStrategy {
        if (this.strategies.length === 0) {
            throw new Error("No fallback strategies registered.");
        }

        let bestStrategy: FallbackStrategy | null = null;
        let highestScore = -Infinity;

        for (const strategy of this.strategies) {
            const { score: currentScore } = strategy.score(context);

            if (currentScore > highestScore) {
                highestScore = currentScore;
                bestStrategy = strategy;
            }
        }

        if (!bestStrategy) {
            throw new Error("Failed to select a strategy.");
        }

        return bestStrategy;
    }

    /**
     * Manages the fallback process: selects the best strategy and executes it.
     * @param context The failure context.
     * @returns A promise resolving to the result of the executed fallback action.
     */
    public async manageFallback(context: FailureContext): Promise<string> {
        const bestStrategy = this.selectBestStrategy(context);

        console.log(`[Fallback Manager] Selected strategy: ${bestStrategy.name}`);
        
        const result = await bestStrategy.execute(context);
        
        return `Successfully executed fallback using ${bestStrategy.name}. Result: ${result}`;
    }
}

export class RetryStrategy implements FallbackStrategy {
    name = "RetryStrategy";

    score(context: FailureContext): { score: number; justification: string } {
        if (context.reason === "API_RATE_LIMIT" || context.reason === "RESOURCE_EXHAUSTION") {
            return { score: 0.9, justification: "Rate limits or resource exhaustion suggest temporary failure, making retry highly probable." };
        }
        return { score: 0.3, justification: "Retry is a general option, but context suggests a deeper issue." };
    }

    async execute(context: FailureContext): Promise<string> {
        // Simulate waiting and retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        return "Attempted retry after delay. Check logs for success.";
    }
}

export class SimplifyContextStrategy implements FallbackStrategy {
    name = "SimplifyContextStrategy";

    score(context: FailureContext): { score: number; justification: string } {
        if (context.reason === "SCHEMA_MISMATCH" || context.error.message.includes("Invalid input")) {
            return { score: 0.95, justification: "Schema mismatch suggests the input context is too complex or malformed. Simplification is best." };
        }
        return { score: 0.5, justification: "Context simplification might help, but is not the primary failure mode." };
    }

    async execute(context: FailureContext): Promise<string> {
        // Simulate simplifying the context (e.g., removing optional parameters)
        const simplifiedContext = JSON.stringify(Object.keys(context.current_state).filter(key => key !== 'optional_field'));
        return `Context successfully simplified. New state keys: ${simplifiedContext}`;
    }
}

export class EscalateToHumanStrategy implements FallbackStrategy {
    name = "EscalateToHumanStrategy";

    score(context: FailureContext): { score: number; justification: string } {
        if (context.reason === "UNKNOWN" || context.error instanceof ReferenceError) {
            return { score: 1.0, justification: "Unknown or critical runtime errors require human intervention immediately." };
        }
        return { score: 0.1, justification: "Human escalation is overkill unless critical failure is detected." };
    }

    async execute(context: FailureContext): Promise<string> {
        // Simulate logging and alerting
        return `Critical failure detected. Alerting human operator with context: ${context.error.message}`;
    }
}