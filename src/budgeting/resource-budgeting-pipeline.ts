interface ResourceUsage {
    tokens: number;
    cost: number;
    timeMs: number;
    computeUnits: number;
}

interface BudgetContext {
    maxTokens: number;
    maxCost: number;
    maxTimeMs: number;
    maxComputeUnits: number;
}

interface PlanStep {
    id: string;
    type: 'tool_call' | 'text_generation' | 'other';
    details: Record<string, unknown>;
}

interface BudgetReport {
    isWithinBudget: boolean;
    totalUsage: ResourceUsage;
    warnings: string[];
}

export interface BudgetEnforcer {
    check(usage: ResourceUsage, context: BudgetContext): { passed: boolean; remaining: ResourceUsage };
}

class BudgetContextManager {
    constructor(private context: BudgetContext) {}

    getRemaining(currentUsage: ResourceUsage): ResourceUsage {
        return {
            tokens: Math.max(0, this.context.maxTokens - currentUsage.tokens),
            cost: Math.max(0, this.context.maxCost - currentUsage.cost),
            timeMs: Math.max(0, this.context.maxTimeMs - currentUsage.timeMs),
            computeUnits: Math.max(0, this.context.maxComputeUnits - currentUsage.computeUnits),
        };
    }
}

class ResourceBudgetingPipeline {
    constructor(private context: BudgetContext) {}

    private createBudgetEnforcer(): BudgetEnforcer {
        return {
            check: (usage: ResourceUsage, context: BudgetContext): { passed: boolean; remaining: ResourceUsage } => {
                const passed = usage.tokens <= context.maxTokens &&
                                usage.cost <= context.maxCost &&
                                usage.timeMs <= context.maxTimeMs &&
                                usage.computeUnits <= context.maxComputeUnits;

                const remaining: ResourceUsage = {
                    tokens: Math.max(0, context.maxTokens - usage.tokens),
                    cost: Math.max(0, context.maxCost - usage.cost),
                    timeMs: Math.max(0, context.maxTimeMs - usage.timeMs),
                    computeUnits: Math.max(0, context.maxComputeUnits - usage.computeUnits),
                };

                return { passed, remaining };
            }
        };
    }

    private estimateStepCost(step: PlanStep): ResourceUsage {
        switch (step.type) {
            case 'tool_call':
                const toolDetails = step.details as { model: string; inputSize: number };
                return {
                    tokens: 50 + toolDetails.inputSize,
                    cost: 0.01 + (toolDetails.inputSize * 0.001),
                    timeMs: 100 + toolDetails.inputSize * 5,
                    computeUnits: 1,
                };
            case 'text_generation':
                const textDetails = step.details as { lengthEstimate: number };
                return {
                    tokens: 100 + textDetails.lengthEstimate,
                    cost: 0.05 + (textDetails.lengthEstimate * 0.005),
                    timeMs: 300 + textDetails.lengthEstimate * 2,
                    computeUnits: 3,
                };
            case 'other':
            default:
                return { tokens: 10, cost: 0.001, timeMs: 10, computeUnits: 0.1 };
        }
    }

    public validatePlan(plan: PlanStep[]): BudgetReport {
        let totalUsage: ResourceUsage = { tokens: 0, cost: 0, timeMs: 0, computeUnits: 0 };
        const warnings: string[] = [];
        let isWithinBudget = true;

        for (const step of plan) {
            const stepUsage = this.estimateStepCost(step);
            
            totalUsage = {
                tokens: totalUsage.tokens + stepUsage.tokens,
                cost: totalUsage.cost + stepUsage.cost,
                timeMs: totalUsage.timeMs + stepUsage.timeMs,
                computeUnits: totalUsage.computeUnits + stepUsage.computeUnits,
            };

            const enforcer = this.createBudgetEnforcer();
            const { passed } = enforcer.check(stepUsage, this.context);

            if (!passed) {
                isWithinBudget = false;
                warnings.push(`Step ${step.id} (${step.type}) exceeds budget limits.`);
            }
        }

        return {
            isWithinBudget,
            totalUsage,
            warnings
        };
    }

    public enforcePlan(plan: PlanStep[], enforcer: BudgetEnforcer): { report: BudgetReport; executablePlan: PlanStep[] } {
        let currentUsage: ResourceUsage = { tokens: 0, cost: 0, timeMs: 0, computeUnits: 0 };
        const executablePlan: PlanStep[] = [];
        const warnings: string[] = [];
        let isWithinBudget = true;

        for (const step of plan) {
            const stepUsage = this.estimateStepCost(step);
            
            const { passed, remaining: _ } = enforcer.check(stepUsage, this.context);

            if (passed) {
                currentUsage = {
                    tokens: currentUsage.tokens + stepUsage.tokens,
                    cost: currentUsage.cost + stepUsage.cost,
                    timeMs: currentUsage.timeMs + stepUsage.timeMs,
                    computeUnits: currentUsage.computeUnits + stepUsage.computeUnits,
                };
                executablePlan.push(step);
            } else {
                isWithinBudget = false;
                warnings.push(`Plan pruned: Step ${step.id} (${step.type}) exceeds remaining budget.`);
            }
        }

        return {
            report: {
                isWithinBudget: isWithinBudget,
                totalUsage: currentUsage,
                warnings: warnings
            },
            executablePlan
        };
    }
}

export { ResourceBudgetingPipeline, BudgetContextManager, BudgetEnforcer };