import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ResourceLimits = {
  timeBudgetSeconds: number;
  maxCostUnits: number;
  memoryLimitMB: number;
  apiRateLimitPerMinute: number;
};

export type PlanStep = {
  toolName: string;
  input: Record<string, unknown>;
  estimatedDurationSeconds: number;
  estimatedCostUnits: number;
};

export interface NegotiationContext {
  proposedPlan: PlanStep[];
  globalLimits: ResourceLimits;
}

export interface ResourceUsageEstimate {
  totalTimeSeconds: number;
  totalCostUnits: number;
  maxMemoryMB: number;
  apiCalls: number;
}

export interface NegotiationResult {
  isFeasible: boolean;
  reason: string;
  resourceUsageEstimate: ResourceUsageEstimate;
  conflicts: string[];
}

type ConstraintValidator = (plan: PlanStep[], limits: ResourceLimits) => {
  isCompliant: boolean;
  message: string;
  estimate: Partial<ResourceUsageEstimate>;
};

class ConstraintNegotiator {
  private validators: ConstraintValidator[];

  constructor() {
    this.validators = [
      this.timeConstraintValidator,
      this.costConstraintValidator,
      this.capabilityValidator,
    ];
  }

  private timeConstraintValidator: ConstraintValidator = (plan, limits) => {
    const totalTime = plan.reduce((acc, step) => acc + step.estimatedDurationSeconds, 0);
    const isCompliant = totalTime <= limits.timeBudgetSeconds;
    return {
      isCompliant,
      message: `Time constraint check: ${totalTime.toFixed(2)}s used vs ${limits.timeBudgetSeconds}s budget.`,
      estimate: { totalTimeSeconds: totalTime },
    };
  };

  private costConstraintValidator: ConstraintValidator = (plan, limits) => {
    const totalCost = plan.reduce((acc, step) => acc + step.estimatedCostUnits, 0);
    const isCompliant = totalCost <= limits.maxCostUnits;
    return {
      isCompliant,
      message: `Cost constraint check: ${totalCost.toFixed(2)} units used vs ${limits.maxCostUnits} units budget.`,
      estimate: { totalCostUnits: totalCost },
    };
  };

  private capabilityValidator: ConstraintValidator = (plan, limits) => {
    let apiCalls = 0;
    let maxMemory = 0;
    const hasUnsupportedTool = plan.some(step => !this.isToolSupported(step.toolName));

    if (hasUnsupportedTool) {
      return {
        isCompliant: false,
        message: "Capability check failed: Plan contains unsupported tools.",
        estimate: { apiCalls: 0, maxMemoryMB: 0 },
      };
    }

    apiCalls = plan.length;
    maxMemory = Math.max(...plan.map(step => step.estimatedMemoryMB || 1));

    const isCompliant = apiCalls <= limits.apiRateLimitPerMinute && maxMemory <= limits.memoryLimitMB;

    return {
      isCompliant,
      message: `Capability check: ${apiCalls} calls (Limit: ${limits.apiRateLimitPerMinute}), ${maxMemory}MB (Limit: ${limits.memoryLimitMB}MB).`,
      estimate: { apiCalls: apiCalls, maxMemoryMB: maxMemory },
    };
  };

  private isToolSupported(toolName: string): boolean {
    const supportedTools = ["search_web", "calculate_math", "fetch_user_profile"];
    return supportedTools.includes(toolName);
  }

  public negotiate(context: NegotiationContext): NegotiationResult {
    let combinedEstimate: Partial<ResourceUsageEstimate> = {
      totalTimeSeconds: 0,
      totalCostUnits: 0,
      maxMemoryMB: 0,
      apiCalls: 0,
    };
    const conflicts: string[] = [];
    let allCompliant = true;

    for (const validator of this.validators) {
      const result = validator(context.proposedPlan, context.globalLimits);
      
      if (!result.isCompliant) {
        allCompliant = false;
        conflicts.push(result.message);
      }

      // Aggregate estimates
      combinedEstimate = {
        ...combinedEstimate,
        ...(result.estimate || {}),
      };
    }

    const finalEstimate: ResourceUsageEstimate = {
      totalTimeSeconds: combinedEstimate.totalTimeSeconds || 0,
      totalCostUnits: combinedEstimate.totalCostUnits || 0,
      maxMemoryMB: combinedEstimate.maxMemoryMB || 0,
      apiCalls: combinedEstimate.apiCalls || 0,
    };

    return {
      isFeasible: allCompliant,
      reason: allCompliant ? "Plan is resource-aware and feasible." : "Plan failed one or more resource constraints.",
      resourceUsageEstimate: finalEstimate,
      conflicts: conflicts,
    };
  }
}

export { ConstraintNegotiator };