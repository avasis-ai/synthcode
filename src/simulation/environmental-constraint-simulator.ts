interface PlanStep {
    actionName: string;
    requiredResources: Record<string, number>;
    estimatedDuration: number;
}

type Plan = PlanStep[];

interface EnvironmentalConstraints {
    maxLatencyMs: number;
    apiRateLimitPerMinute: number;
    serviceDegradationFactor: number;
}

type Environment = EnvironmentalConstraints;

interface ConstraintViolation {
    constraintName: string;
    violated: boolean;
    impactScore: number;
}

interface SimulationResult {
    isFeasible: boolean;
    predictedLatencyMs: number;
    riskScore: number;
    violationDetails: ConstraintViolation[];
}

export interface EnvironmentalConstraint {
    name: string;
    check(plan: Plan, environment: Environment): { violated: boolean; impactScore: number };
}

class EnvironmentalConstraintSimulator {
    private constraints: EnvironmentalConstraint[];

    constructor(constraints: EnvironmentalConstraint[] = []) {
        this.constraints = constraints;
    }

    static createDefaultConstraints(): EnvironmentalConstraint[] {
        return [
            {
                name: "LatencyConstraint",
                check(plan, environment) {
                    let totalLatency = 0;
                    for (const step of plan) {
                        // Simulate latency based on duration and degradation
                        const stepLatency = step.estimatedDuration * (1 + environment.serviceDegradationFactor);
                        totalLatency += stepLatency;
                    }
                    const violated = totalLatency > environment.maxLatencyMs;
                    const impactScore = Math.min(1, totalLatency / environment.maxLatencyMs);
                    return { violated, impactScore };
                }
            },
            {
                name: "RateLimitConstraint",
                check(plan, environment) {
                    let totalApiCalls = 0;
                    for (const step of plan) {
                        totalApiCalls += step.requiredResources["apiCalls"] || 0;
                    }
                    // Simple check: total calls must be less than rate limit per minute
                    const violated = totalApiCalls > environment.apiRateLimitPerMinute;
                    const impactScore = Math.min(1, totalApiCalls / environment.apiRateLimitPerMinute);
                    return { violated, impactScore };
                }
            }
        ];
    }

    simulate(plan: Plan, environment: Environment): SimulationResult {
        let totalRiskScore = 0;
        const violationDetails: ConstraintViolation[] = [];

        for (const constraint of this.constraints) {
            const result = constraint.check(plan, environment);
            violationDetails.push({
                constraintName: constraint.name,
                violated: result.violated,
                impactScore: result.impactScore
            });
            totalRiskScore += result.impactScore;
        }

        const isFeasible = totalRiskScore < 1.5; // Arbitrary threshold for feasibility
        
        return {
            isFeasible,
            predictedLatencyMs: plan.reduce((acc, step) => acc + step.estimatedDuration, 0) * (1 + environment.serviceDegradationFactor),
            riskScore: totalRiskScore,
            violationDetails: violationDetails
        };
    }

    predictImpact(plan: Plan, environment: Environment): { riskScore: number; feasibilityAdvice: string } {
        const result = this.simulate(plan, environment);
        let advice = "The plan appears robust under current environmental conditions.";

        if (!result.isFeasible) {
            advice = `WARNING: The plan is predicted to fail or degrade significantly. Key risks detected: ${result.violationDetails.filter(v => v.violated).map(v => v.constraintName).join(', ')}.`;
        } else if (result.riskScore > 0.8) {
            advice = "CAUTION: The plan is feasible but operates close to environmental limits. Consider adding redundancy.";
        }

        return {
            riskScore: result.riskScore,
            feasibilityAdvice: advice
        };
    }
}

export { EnvironmentalConstraintSimulator, EnvironmentalConstraint };