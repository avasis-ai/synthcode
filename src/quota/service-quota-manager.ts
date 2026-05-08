import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type RateLimit = {
    limit: number;
    windowMs: number;
    currentUsage: number;
};

type CostBudget = {
    maxCost: number;
    currentCost: number;
};

type UsageCap = {
    maxUses: number;
    currentUses: number;
};

type TimeWindow = {
    startTimeMs: number;
    endTimeMs: number;
    isActive: boolean;
};

export interface QuotaDefinition {
    rateLimit?: RateLimit;
    costBudget?: CostBudget;
    usageCap?: UsageCap;
    timeWindow?: TimeWindow;
}

export class ServiceQuotaManager {
    private quotas: Map<string, QuotaDefinition>;

    constructor(initialQuotas: Record<string, QuotaDefinition> = {}) {
        this.quotas = new Map<string, QuotaDefinition>();
        Object.entries(initialQuotas).forEach(([serviceId, definition]) => {
            this.quotas.set(serviceId, definition);
        });
    }

    private checkRateLimit(serviceId: string, context: Record<string, unknown>): boolean {
        const quota = this.quotas.get(serviceId);
        if (!quota || !quota.rateLimit) {
            return true;
        }

        const rateLimit = quota.rateLimit;
        const currentTime = Date.now();
        
        // Simple simulation: Check if usage exceeds limit within the window
        if (rateLimit.currentUsage >= rateLimit.limit) {
            return false;
        }
        
        // In a real system, we would reset usage based on time elapsed
        return true;
    }

    private checkCostBudget(serviceId: string, context: Record<string, unknown>): boolean {
        const quota = this.quotas.get(serviceId);
        if (!quota || !quota.costBudget) {
            return true;
        }

        const costBudget = quota.costBudget;
        const estimatedCost = context.estimatedCost || 0;

        if (costBudget.currentCost + estimatedCost > costBudget.maxCost) {
            return false;
        }
        return true;
    }

    private checkUsageCap(serviceId: string, context: Record<string, unknown>): boolean {
        const quota = this.quotas.get(serviceId);
        if (!quota || !quota.usageCap) {
            return true;
        }

        const usageCap = quota.usageCap;
        const usageIncrement = context.usageIncrement || 1;

        if (usageCap.currentUses + usageIncrement > usageCap.maxUses) {
            return false;
        }
        return true;
    }

    private checkTimeWindow(serviceId: string, context: Record<string, unknown>): boolean {
        const quota = this.quotas.get(serviceId);
        if (!quota || !quota.timeWindow) {
            return true;
        }

        const timeWindow = quota.timeWindow;
        const currentTime = Date.now();

        if (!timeWindow.isActive || currentTime < timeWindow.startTimeMs || currentTime > timeWindow.endTimeMs) {
            return false;
        }
        return true;
    }

    /**
     * Attempts to acquire permission for a service call by checking all defined quotas.
     * @param serviceId The ID of the service being called.
     * @param context Contextual data needed for quota checks (e.g., estimatedCost, usageIncrement).
     * @returns True if all quotas are satisfied, false otherwise.
     */
    public acquire(serviceId: string, context: Record<string, unknown>): boolean {
        const quota = this.quotas.get(serviceId);
        if (!quota) {
            // No quota defined for this service, assume success
            return true;
        }

        // Check all defined constraints sequentially
        if (!this.checkRateLimit(serviceId, context)) {
            return false;
        }

        if (!this.checkCostBudget(serviceId, context)) {
            return false;
        }

        if (!this.checkUsageCap(serviceId, context)) {
            return false;
        }

        if (!this.checkTimeWindow(serviceId, context)) {
            return false;
        }

        // If all checks pass, the quota is acquired.
        // NOTE: In a real system, this method would also update the quota state (e.g., increment usage).
        return true;
    }
}