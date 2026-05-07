import { ToolDefinition, ToolCallContext } from "../types/synth-types.js";

export interface FeasibilityReport {
  isFeasible: boolean;
  estimatedCost: number;
  violationReasons: string[];
}

export class FeasibilityValidator {
  private context: ToolCallContext;
  private toolDefinition: ToolDefinition;

  constructor(context: ToolCallContext, toolDefinition: ToolDefinition) {
    this.context = context;
    this.toolDefinition = toolDefinition;
  }

  private checkBudget(): { violation: boolean; reason: string; cost: number } {
    const maxBudget = this.context.globalConstraints.budget || Infinity;
    const requiredCost = this.toolDefinition.costEstimate || 0;

    if (requiredCost > maxBudget) {
      return {
        violation: true,
        reason: `Exceeds budget limit. Required: ${requiredCost}, Max: ${maxBudget}.`,
        cost: requiredCost,
      };
    }
    return { violation: false, reason: "", cost: requiredCost };
  }

  private checkTimeWindow(): { violation: boolean; reason: string; cost: number } {
    const startTime = this.context.globalConstraints.startTime;
    const endTime = this.context.globalConstraints.endTime;
    const requiredDuration = this.toolDefinition.durationEstimate || 0;

    if (startTime && endTime && startTime + requiredDuration > endTime) {
      return {
        violation: true,
        reason: `Tool execution duration (${requiredDuration}) exceeds the available time window.`,
        cost: 0,
      };
    }
    return { violation: false, reason: "", cost: 0 };
  }

  private checkPermissions(): { violation: boolean; reason: string; cost: number } {
    const requiredPermissions = this.toolDefinition.requiredPermissions || [];
    const availablePermissions = this.context.globalConstraints.permissions || [];

    const missingPermissions = requiredPermissions.filter(
      (p) => !availablePermissions.includes(p)
    );

    if (missingPermissions.length > 0) {
      return {
        violation: true,
        reason: `Missing required permissions: ${missingPermissions.join(', ')}.`,
        cost: 0,
      };
    }
    return { violation: false, reason: "", cost: 0 };
  }

  public validate(): FeasibilityReport {
    const budgetCheck = this.checkBudget();
    const timeCheck = this.checkTimeWindow();
    const permissionCheck = this.checkPermissions();

    const violations = [
      budgetCheck.violation,
      timeCheck.violation,
      permissionCheck.violation,
    ].filter(Boolean);

    const isFeasible = violations.length === 0;
    const violationReasons = [
      ...(violations.includes(true) ? [`Budget violation: ${budgetCheck.reason}`] : []),
      ...(violations.includes(true) ? [`Time window violation: ${timeCheck.reason}`] : []),
      ...(violations.includes(true) ? [`Permission violation: ${permissionCheck.reason}`] : []),
    ];

    const estimatedCost = Math.max(
      budgetCheck.cost,
      timeCheck.cost,
      permissionCheck.cost
    );

    return {
      isFeasible,
      estimatedCost,
      violationReasons: violationReasons.filter(Boolean),
    };
  }
}