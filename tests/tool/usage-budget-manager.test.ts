import { describe, it, expect } from "vitest";
import { UsageBudgetManager, BudgetExceededError } from "../src/tool/usage-budget-manager";

describe("UsageBudgetManager", () => {
    it("should initialize correctly with a budget", () => {
        const mockBudget: UsageBudget = {
            limits: { "api_calls": 100, "storage": 50 },
            calculateCost: (usage) => ({ "api_calls": usage["api_calls"] * 1, "storage": usage["storage"] * 0.1 }),
        };
        const manager = new UsageBudgetManager(mockBudget);
        // We can't directly test private fields, but we can test its functionality.
        // For this test, we assume successful initialization means no error.
        expect(manager).toBeDefined();
    });

    it("should throw BudgetExceededError when usage exceeds limits", () => {
        const mockBudget: UsageBudget = {
            limits: { "api_calls": 10 },
            calculateCost: (usage) => ({ "api_calls": usage["api_calls"] }),
        };
        const manager = new UsageBudgetManager(mockBudget);

        // Simulate usage that exceeds the limit
        const excessiveUsage: Record<string, number> = { "api_calls": 11 };
        expect(() => manager.recordUsage(excessiveUsage)).toThrow(BudgetExceededError);
        expect(() => manager.recordUsage(excessiveUsage)).toThrow("api_calls budget exceeded");
    });

    it("should successfully record usage within budget", () => {
        const mockBudget: UsageBudget = {
            limits: { "api_calls": 20 },
            calculateCost: (usage) => ({ "api_calls": usage["api_calls"] }),
        };
        const manager = new UsageBudgetManager(mockBudget);

        // Simulate usage within the limit
        const safeUsage: Record<string, number> = { "api_calls": 15 };
        expect(() => manager.recordUsage(safeUsage)).not.toThrow();
    });
});