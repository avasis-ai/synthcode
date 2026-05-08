import { describe, it, expect, vi } from "vitest";
import { QuotaManager } from "../../../src/quota/service-quota-manager";

describe("QuotaManager", () => {
    it("should initialize with default values and correctly calculate remaining quota", () => {
        const quotaManager = new QuotaManager({
            rateLimit: { limit: 10, windowMs: 60000, currentUsage: 0 },
            costBudget: { maxCost: 100, currentCost: 0 },
            usageCap: { maxUses: 50, currentUses: 0 },
        });

        expect(quotaManager.getRateLimitRemaining()).toBe(10);
        expect(quotaManager.getCostBudgetRemaining()).toBe(100);
        expect(quotaManager.getUsageCapRemaining()).toBe(50);
    });

    it("should correctly decrement rate limit usage and check for overage", () => {
        const quotaManager = new QuotaManager({
            rateLimit: { limit: 5, windowMs: 1000, currentUsage: 3 },
            costBudget: { maxCost: 100, currentCost: 0 },
            usageCap: { maxUses: 10, currentUses: 0 },
        });

        // Successful decrement
        quotaManager.consumeRateLimit(1);
        expect(quotaManager.getRateLimitRemaining()).toBe(4);

        // Simulate reaching the limit
        quotaManager.consumeRateLimit(4);
        expect(quotaManager.getRateLimitRemaining()).toBe(0);

        // Attempting to exceed the limit
        quotaManager.consumeRateLimit(1);
        expect(quotaManager.getRateLimitExceeded()).toBe(true);
    });

    it("should correctly manage cost budget and usage cap consumption", () => {
        const quotaManager = new QuotaManager({
            rateLimit: { limit: 10, windowMs: 60000, currentUsage: 0 },
            costBudget: { maxCost: 50, currentCost: 10 },
            usageCap: { maxUses: 5, currentUses: 2 },
        });

        // Consume cost
        quotaManager.consumeCost(20);
        expect(quotaManager.getCostBudgetRemaining()).toBe(10);

        // Consume usage
        quotaManager.consumeUsage(3);
        expect(quotaManager.getUsageCapRemaining()).toBe(0);

        // Attempting to exceed cost
        quotaManager.consumeCost(1);
        expect(quotaManager.getCostBudgetExceeded()).toBe(true);
    });
});