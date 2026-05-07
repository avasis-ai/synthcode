export interface CostMetrics {
    estimatedCostUSD: number;
    breakdown: Record<string, number>;
    isCostEstimate: boolean;
}

export interface ResourceUsage {
    cpuUtilizationPercent: number;
    memoryUsageBytes: number;
    executionTimeMs: number;
    isPeakUsage: boolean;
}

export interface GovernanceStatus {
    hasViolations: boolean;
    violationCount: number;
    complianceScore: number;
    violationDetails: string[];
}

export interface DriftIndicators {
    isDrifting: boolean;
    driftScore: number;
    observedState: Record<string, unknown>;
    expectedState: Record<string, unknown>;
}

export interface ObservabilityContext {
    cost: CostMetrics;
    resourceUsage: ResourceUsage;
    governance: GovernanceStatus;
    drift: DriftIndicators;
    timestamp: number;
    isComplete: boolean;
}

export class ObservabilityContextBuilder {
    private costMetrics: CostMetrics;
    private resourceUsage: ResourceUsage;
    private governanceStatus: GovernanceStatus;
    private driftIndicators: DriftIndicators;

    constructor(initialCost: CostMetrics, initialResource: ResourceUsage, initialGovernance: GovernanceStatus, initialDrift: DriftIndicators) {
        this.costMetrics = initialCost;
        this.resourceUsage = initialResource;
        this.governanceStatus = initialGovernance;
        this.driftIndicators = initialDrift;
    }

    public addCostMetrics(cost: CostMetrics): this {
        this.costMetrics = cost;
        return this;
    }

    public addResourceUsage(usage: ResourceUsage): this {
        this.resourceUsage = usage;
        return this;
    }

    public addGovernanceStatus(status: GovernanceStatus): this {
        this.governanceStatus = status;
        return this;
    }

    public addDriftIndicators(indicators: DriftIndicators): this {
        this.driftIndicators = indicators;
        return this;
    }

    public build(): ObservabilityContext {
        return {
            cost: this.costMetrics,
            resourceUsage: this.resourceUsage,
            governance: this.governanceStatus,
            drift: this.driftIndicators,
            timestamp: Date.now(),
            isComplete: true
        };
    }
}