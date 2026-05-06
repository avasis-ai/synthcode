import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

export interface FailureReport {
  failureType: "ConstraintViolation" | "ToolFailure" | "GoalDrift" | "Unknown";
  context: string;
  evidence: string;
  failedStepId: string;
}

export interface CorrectionPlan {
  isCorrectionNecessary: boolean;
  rootCauseAnalysis: string;
  assumptionsToChallenge: string[];
  suggestedModifications: {
    stepId: string;
    modification: string;
    reason: string;
  }[];
  newGoalRefinement: string;
}

export class FailureAnalysisEngine {
  constructor() {}

  private analyzeConstraints(report: FailureReport): string {
    if (report.failureType === "ConstraintViolation") {
      return `The failure indicates a direct violation of established constraints. The system must re-evaluate the input parameters against the defined schema or ruleset.`;
    }
    return "Constraint check passed or violation is not the primary root cause.";
  }

  private reviewAssumptions(report: FailureReport): string[] {
    if (report.failureType === "GoalDrift") {
      return ["The initial goal definition might be too broad.", "The intermediate success criteria were misinterpreted.", "The current context assumes a linear progression that may not hold."];
    }
    return ["All assumptions appear valid based on the provided context.", "No specific assumptions challenged at this stage."];
  }

  private reevaluateContext(report: FailureReport, originalGoal: string): string {
    return `The original goal (${originalGoal}) must be re-scoped. The failure suggests that the current context is insufficient or misleading. Focus must shift to validating the preconditions before proceeding.`;
  }

  public analyze(
    report: FailureReport,
    originalGoal: string,
    history: Message[]
  ): CorrectionPlan {
    const rootCauseAnalysis = `Failure Type: ${report.failureType}. Evidence: "${report.evidence}". The failure occurred at step ${report.failedStepId}.`;

    const assumptionsToChallenge = this.reviewAssumptions(report);

    const suggestedModifications = [];
    if (report.failureType === "ToolFailure") {
      suggestedModifications.push({
        stepId: report.failedStepId,
        modification: "Retry the tool call with sanitized input.",
        reason: "The tool output suggests transient failure or bad input formatting.",
      });
    } else if (report.failureType === "ConstraintViolation") {
      suggestedModifications.push({
        stepId: report.failedStepId,
        modification: "Adjust the input parameters based on the constraint violation message.",
        reason: "The input failed validation; modification is required to meet structural requirements.",
      });
    }

    const newGoalRefinement = this.reevaluateContext(report, originalGoal);

    return {
      isCorrectionNecessary: true,
      rootCauseAnalysis: rootCauseAnalysis,
      assumptionsToChallenge: assumptionsToChallenge,
      suggestedModifications: suggestedModifications,
      newGoalRefinement: newGoalRefinement,
    };
  }
}

export { FailureAnalysisEngine };