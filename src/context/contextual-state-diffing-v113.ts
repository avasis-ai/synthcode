import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type TemporalResourceConstraint = {
  timeWindowMs: number;
  maxResourceUsage: number;
};

export type StateDiff = {
  dataDiff: Record<string, any>;
  temporalViolation: boolean;
  resourceViolation: boolean;
  details: string[];
};

export class ContextualStateDiffer {
  private readonly constraint: TemporalResourceConstraint;

  constructor(constraint: TemporalResourceConstraint) {
    this.constraint = constraint;
  }

  private checkTemporalViolation(prevState: any, currState: any): boolean {
    // Simplified check: Assume state includes a 'timestamp' property
    if (typeof prevState.timestamp === 'undefined' || typeof currState.timestamp === 'undefined') {
      return false;
    }
    const timeDiff = Math.abs(currState.timestamp - prevState.timestamp);
    return timeDiff > this.constraint.timeWindowMs;
  }

  private checkResourceViolation(prevState: any, currState: any): boolean {
    // Simplified check: Assume state includes a 'resourceUsage' property
    if (typeof prevState.resourceUsage === 'undefined' || typeof currState.resourceUsage === 'undefined') {
      return false;
    }
    return Math.abs(currState.resourceUsage - prevState.resourceUsage) > this.constraint.maxResourceUsage;
  }

  public calculateDiff(currentState: any, previousState: any): StateDiff {
    const dataDiff: Record<string, any> = {};
    const details: string[] = [];

    // 1. Data Value Diffing (Generic deep comparison placeholder)
    const keys = new Set([...Object.keys(currentState), ...Object.keys(previousState)]);
    for (const key of keys) {
      const currentVal = (currentState as any)[key];
      const previousVal = (previousState as any)[key];

      if (typeof currentVal === 'undefined' && typeof previousVal === 'undefined') continue;

      if (JSON.stringify(currentVal) !== JSON.stringify(previousVal)) {
        dataDiff[key] = {
          previous: previousVal,
          current: currentVal,
        };
      }
    }

    // 2. Temporal Constraint Check
    const temporalViolation = this.checkTemporalViolation(previousState, currentState);
    if (temporalViolation) {
      details.push(`Temporal violation detected: State change occurred outside the allowed window of ${this.constraint.timeWindowMs}ms.`);
    }

    // 3. Resource Constraint Check
    const resourceViolation = this.checkResourceViolation(previousState, currentState);
    if (resourceViolation) {
      details.push(`Resource violation detected: State change exceeded the allowed resource delta of ${this.constraint.maxResourceUsage}.`);
    }

    return {
      dataDiff,
      temporalViolation,
      resourceViolation,
      details,
    };
  }
}