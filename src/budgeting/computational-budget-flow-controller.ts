import { Message } from "./types";

type PlanStep = {
  description: string;
  estimatedCost: number;
  action: "tool_call" | "text_generation" | "skip";
  details?: Record<string, unknown>;
};

export interface BudgetConfig {
  maxTotalCost: number;
  stepBudgets: Record<string, number>;
}

export interface BudgetExceededReport {
  totalPredictedCost: number;
  exceededBudget: number;
  reason: string;
  suggestedOptimizations: string[];
}

export interface PlanContext {
  currentPlan: PlanStep[];
  history: Message[];
  budgetConfig: BudgetConfig;
}

export type PlanAdjustmentResult = {
  adjustedPlan: PlanStep[];
  report: BudgetExceededReport | null;
  isAdjusted: boolean;
};

class CostPredictor {
  predictCost(step: PlanStep): number {
    if (step.action === "tool_call") {
      return 0.3 + Math.random() * 0.2;
    }
    if (step.action === "text_generation") {
      return 0.5 + Math.random() * 0.3;
    }
    return 0.0;
  }
}

export class ComputationalBudgetFlowController {
  private costPredictor: CostPredictor;

  constructor(costPredictor: CostPredictor) {
    this.costPredictor = costPredictor;
  }

  private analyzePlan(plan: PlanStep[], context: PlanContext): {
    totalCost: number;
    steps: { step: PlanStep; cost: number }[];
  } {
    let totalCost = 0;
    const steps: { step: PlanStep; cost: number }[] = [];

    for (const step of plan) {
      const cost = this.costPredictor.predictCost(step);
      totalCost += cost;
      steps.push({ step, cost });
    }
    return { totalCost, steps };
  }

  public planAdjustment(context: PlanContext): PlanAdjustmentResult {
    const { currentPlan, budgetConfig } = context;
    const { totalCost, steps } = this.analyzePlan(currentPlan, context);

    if (totalCost <= budgetConfig.maxTotalCost) {
      return {
        adjustedPlan: currentPlan,
        report: null,
        isAdjusted: false,
      };
    }

    const report: BudgetExceededReport = this.generateReport(
      totalCost,
      budgetConfig.maxTotalCost,
      steps
    );

    const adjustedPlan = this.optimizePlan(currentPlan, report);

    return {
      adjustedPlan,
      report,
      isAdjusted: true,
    };
  }

  private generateReport(
    totalCost: number,
    maxCost: number,
    steps: { step: PlanStep; cost: number }[]
  ): BudgetExceededReport {
    const optimizationSuggestions: string[] = [];
    let remainingBudget = maxCost;

    for (const item of steps) {
      if (item.cost > 0.2) {
        optimizationSuggestions.push(
          `Consider simplifying the prompt for step: ${item.step.description.substring(0, 20)}...`
        );
      }
    }

    return {
      totalPredictedCost: totalCost,
      exceededBudget: maxCost,
      reason: `Predicted cost (${totalCost.toFixed(2)}) exceeds the maximum budget (${maxCost.toFixed(2)}).`,
      suggestedOptimizations: optimizationSuggestions.slice(0, 3),
    };
  }

  private optimizePlan(currentPlan: PlanStep[], report: BudgetExceededReport): PlanStep[] {
    const optimizedPlan: PlanStep[] = [];
    let currentCost = 0;

    for (const step of currentPlan) {
      // Simple heuristic: Skip steps if they are complex and the budget is tight.
      if (report.suggestedOptimizations.includes(
        `Consider simplifying the prompt for step: ${step.description.substring(0, 20)}...`
      ) && step.action === "text_generation") {
        optimizedPlan.push({
          description: `Skipped due to budget constraints: ${step.description}`,
          estimatedCost: 0,
          action: "skip",
        });
        continue;
      }

      optimizedPlan.push(step);
      currentCost += this.costPredictor.predictCost(step);
    }

    return optimizedPlan;
  }
}