export type ResourceCostModel = {
    cpu_cores: number;
    memory_mb: number;
    api_quota_units: number;
    network_bandwidth_mbps: number;
};

export interface StepContext {
    id: string;
    description: string;
    resourceCost: ResourceCostModel;
    // Add other context fields if needed, but resourceCost is key
}

export interface ContentionReport {
    totalUsage: ResourceCostModel;
    violations: {
        stepId: string;
        resource: keyof ResourceCostModel;
        currentUsage: number;
        limit: number;
        message: string;
    }[];
    isContentionDetected: boolean;
}

export class ResourceContentionPredictor {
    private readonly globalLimits: Record<keyof ResourceCostModel, number>;

    constructor(globalLimits: Record<keyof ResourceCostModel, number>) {
        this.globalLimits = globalLimits;
    }

    private checkViolation(
        step: StepContext,
        currentUsage: ResourceCostModel,
        resourceKey: keyof ResourceCostModel
    ): {
        violation: boolean;
        message: string;
    } {
        const limit = this.globalLimits[resourceKey];
        const usage = currentUsage[resourceKey];

        if (usage > limit) {
            return {
                violation: true,
                message: `${resourceKey} usage (${usage.toFixed(2)}) exceeds global limit (${limit.toFixed(2)}).`
            };
        }
        return { violation: false, message: "" };
    }

    public predictContention(steps: StepContext[]): ContentionReport {
        let accumulatedUsage: ResourceCostModel = {
            cpu_cores: 0,
            memory_mb: 0,
            api_quota_units: 0,
            network_bandwidth_mbps: 0,
        };

        const violations: ContentionReport['violations'] = [];
        let currentUsageSnapshot: ResourceCostModel = {
            cpu_cores: 0,
            memory_mb: 0,
            api_quota_units: 0,
            network_bandwidth_mbps: 0,
        };

        for (const step of steps) {
            // Calculate potential usage after this step
            const nextUsage: ResourceCostModel = {
                cpu_cores: accumulatedUsage.cpu_cores + step.resourceCost.cpu_cores,
                memory_mb: accumulatedUsage.memory_mb + step.resourceCost.memory_mb,
                api_quota_units: accumulatedUsage.api_quota_units + step.resourceCost.api_quota_units,
                network_bandwidth_mbps: accumulatedUsage.network_bandwidth_mbps + step.resourceCost.network_bandwidth_mbps,
            };

            // Check for violations at the point of execution
            const checkResource = (resourceKey: keyof ResourceCostModel) => {
                const limit = this.globalLimits[resourceKey];
                const usage = nextUsage[resourceKey];

                if (usage > limit) {
                    violations.push({
                        stepId: step.id,
                        resource: resourceKey,
                        currentUsage: usage,
                        limit: limit,
                        message: `Predicted exhaustion of ${resourceKey}. Usage (${usage.toFixed(2)}) exceeds limit (${limit.toFixed(2)}).`
                    });
                }
            };

            checkResource('cpu_cores');
            checkResource('memory_mb');
            checkResource('api_quota_units');
            checkResource('network_bandwidth_mbps');

            // Update accumulated usage for the next step
            accumulatedUsage = nextUsage;
        }

        const report: ContentionReport = {
            totalUsage: accumulatedUsage,
            violations: violations,
            isContentionDetected: violations.length > 0,
        };

        return report;
    }
}

export { ResourceContentionPredictor };