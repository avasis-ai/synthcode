import { describe, it, expect, vi } from "vitest";
import {
    ContextualFallbackStrategyManager,
    FailureContext,
    FallbackStrategy,
} from "../src/fallback/contextual-fallback-strategy-manager";

describe("ContextualFallbackStrategyManager", () => {
    it("should select the best strategy based on a given failure context", async () => {
        const mockContext: FailureContext = {
            error: new Error("Schema mismatch"),
            reason: "SCHEMA_MISMATCH",
            current_state: {
                user_id: "123",
            },
            attempted_action: "process_data",
            message_history: [],
        };

        const strategies: FallbackStrategy[] = [
            {
                name: "RetryWithBackoff",
                score: (context: FailureContext) => {
                    if (context.reason === "API_RATE_LIMIT") return 10;
                    if (context.reason === "SCHEMA_MISMATCH") return 5;
                    return 0;
                },
            },
            {
                name: "UseCachedData",
                score: (context: FailureContext) => {
                    if (context.reason === "SCHEMA_MISMATCH" && context.current_state.user_id === "123") return 20;
                    return 0;
                },
            },
        ];

        const manager = new ContextualFallbackStrategyManager(strategies);
        const bestStrategy = manager.getBestStrategy(mockContext);

        expect(bestStrategy).toBeDefined();
        expect(bestStrategy?.name).toBe("UseCachedData");
    });

    it("should handle cases where no strategy is suitable (all scores are zero)", async () => {
        const mockContext: FailureContext = {
            error: new Error("Unknown failure"),
            reason: "UNKNOWN",
            current_state: {
                data: "test",
            },
            attempted_action: "unknown_action",
            message_history: [],
        };

        const strategies: FallbackStrategy[] = [
            {
                name: "StrategyA",
                score: (context: FailureContext) => {
                    if (context.reason === "API_RATE_LIMIT") return 10;
                    return 0;
                },
            },
            {
                name: "StrategyB",
                score: (context: FailureContext) => {
                    if (context.reason === "SCHEMA_MISMATCH") return 5;
                    return 0;
                },
            },
        ];

        const manager = new ContextualFallbackStrategyManager(strategies);
        const bestStrategy = manager.getBestStrategy(mockContext);

        expect(bestStrategy).toBeDefined();
        expect(bestStrategy?.name).toBe("StrategyA"); // Should return the first strategy if all scores are 0
    });

    it("should return the correct strategy when multiple strategies have the same highest score", async () => {
        const mockContext: FailureContext = {
            error: new Error("Rate limited"),
            reason: "API_RATE_LIMIT",
            current_state: {
                key: "test",
            },
            attempted_action: "fetch_data",
            message_history: [],
        };

        const strategies: FallbackStrategy[] = [
            {
                name: "StrategyX",
                score: (context: FailureContext) => {
                    if (context.reason === "API_RATE_LIMIT") return 10;
                    return 0;
                },
            },
            {
                name: "StrategyY",
                score: (context: FailureContext) => {
                    if (context.reason === "API_RATE_LIMIT") return 10;
                    return 0;
                },
            },
        ];

        const manager = new ContextualFallbackStrategyManager(strategies);
        const bestStrategy = manager.getBestStrategy(mockContext);

        expect(bestStrategy).toBeDefined();
        // It should return the first strategy encountered with the highest score
        expect(bestStrategy?.name).toBe("StrategyX");
    });
});