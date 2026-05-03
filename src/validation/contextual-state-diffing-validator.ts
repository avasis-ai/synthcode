import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface StateTransitionRule {
  name: string;
  preConditions: (currentState: Record<string, any>, payload: Record<string, any>) => {
    isValid: boolean;
    message?: string;
  } | null;
  postConditions: (currentState: Record<string, any>, proposedState: Record<string, any>) => {
    isValid: boolean;
    message?: string;
  } | null;
  affectedFields: string[];
}

export interface StateDiffReport {
  ruleName: string;
  isValid: boolean;
  violations: string[];
}

export class ContextualStateDiffingValidator {
  private readonly currentState: Record<string, any>;
  private readonly proposedState: Record<string, any>;
  private readonly rules: StateTransitionRule[];

  constructor(
    currentState: Record<string, any>,
    proposedState: Record<string, any>,
    rules: StateTransitionRule[]
  ) {
    this.currentState = currentState;
    this.proposedState = proposedState;
    this.rules = rules;
  }

  validate(): StateDiffReport[] {
    const reports: StateDiffReport[] = [];
    for (const rule of this.rules) {
      const report: StateDiffReport = {
        ruleName: rule.name,
        isValid: true,
        violations: [],
      };

      let preConditionPassed = true;
      if (rule.preConditions) {
        const preResult = rule.preConditions(this.currentState, this.proposedState);
        if (!preResult || !preResult.isValid) {
          preConditionPassed = false;
          report.isValid = false;
          report.violations.push(
            preResult?.message || "Pre-condition failed."
          );
        }
      }

      let postConditionPassed = true;
      if (rule.postConditions) {
        const postResult = rule.postConditions(this.currentState, this.proposedState);
        if (!postResult || !postResult.isValid) {
          postConditionPassed = false;
          report.isValid = false;
          report.violations.push(
            postResult?.message || "Post-condition failed."
          );
        }
      }

      if (!preConditionPassed || !postConditionPassed) {
        reports.push(report);
      } else {
        reports.push(report);
      }
    }
    return reports;
  }
}