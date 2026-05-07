import { Message, ContentBlock, TextBlock } from "./types";

type FailureType = "validation" | "constraint" | "conflict" | "unknown";

export interface FailureDetail {
  type: FailureType;
  message: string;
  details: Record<string, any>;
}

export interface FailureReport {
  timestamp: Date;
  source: string;
  failures: FailureDetail[];
  summary: string;
}

export interface CorrectionStep {
  stepId: string;
  action: string;
  description: string;
  requiredInputs: Record<string, string>;
  priority: number;
}

export interface CorrectionPlan {
  planId: string;
  steps: CorrectionStep[];
  overallGoal: string;
}

export class CorrectionPlanGenerator {
  private availableStrategies: string[];

  constructor(availableStrategies: string[]) {
    this.availableStrategies = availableStrategies;
  }

  analyze(report: FailureReport): CorrectionPlan {
    const steps: CorrectionStep[] = [];
    const failureTypes = report.failures.map(f => f.type);

    if (failureTypes.length === 0) {
      return {
        planId: "N/A",
        steps: [],
        overallGoal: "No failures detected. Proceeding with current plan."
      };
    }

    let stepCount = 1;

    // 1. Handle Validation Failures (Highest Priority)
    const validationFailures = report.failures.filter(f => f.type === "validation");
    if (validationFailures.length > 0) {
      steps.push({
        stepId: `V-${stepCount++}`,
        action: "Adjust Input Parameters",
        description: `Addressing ${validationFailures.length} validation failures. Review input schema adherence.`,
        requiredInputs: {
          schema_check: "true",
          source_report: report.source
        },
        priority: 1
      });
    }

    // 2. Handle Constraint Violations
    const constraintFailures = report.failures.filter(f => f.type === "constraint");
    if (constraintFailures.length > 0) {
      steps.push({
        stepId: `C-${stepCount++}`,
        action: "Re-query or Refine Constraints",
        description: `Investigating ${constraintFailures.length} constraint violations. Check source data integrity.`,
        requiredInputs: {
          constraint_set: "all",
          source_report: report.source
        },
        priority: 2
      });
    }

    // 3. Handle Conflicts (Lowest Priority, often requires simplification)
    const conflictFailures = report.failures.filter(f => f.type === "conflict");
    if (conflictFailures.length > 0) {
      steps.push({
        stepId: `F-${stepCount++}`,
        action: "Simplify Goal or Scope",
        description: `Resolving ${conflictFailures.length} resource conflicts. Consider simplifying the overall goal.`,
        requiredInputs: {
          scope_reduction: "suggested",
          conflict_details: "all"
        },
        priority: 3
      });
    }

    // 4. General Fallback/Retry Step
    if (steps.length === 0) {
      steps.push({
        stepId: "G-1",
        action: "Retry Execution",
        description: "No specific failure type detected, attempting a general retry.",
        requiredInputs: {
          retry_count: "1"
        },
        priority: 5
      });
    }

    return {
      planId: `PLAN-${Date.now()}`,
      steps: steps,
      overallGoal: `Generate a correction plan based on ${report.failures.length} detected failures.`
    };
  }
}