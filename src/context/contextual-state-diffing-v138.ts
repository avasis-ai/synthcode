import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Constraint {
  type: string;
  validate: (currentState: any, proposedState: any, diff: any) => {
    isValid: boolean;
    reason?: string;
  };
}

export interface TemporalResourceConstraint extends Constraint {
  resourceName: string;
  initialValue: any;
  checkTemporal: (currentState: any, proposedState: any, diff: any) => {
    isValid: boolean;
    reason?: string;
  };
  checkResource: (currentState: any, proposedState: any, diff: any) => {
    isValid: boolean;
    reason?: string;
  };
}

export interface StateDiffReport {
  diff: any;
  violations: {
    constraintName: string;
    violationType: "ResourceExceeded" | "TemporalViolation" | "GeneralViolation";
    reason: string;
  }[];
  isStateValid: boolean;
}

export class ContextualStateDiffCalculator {
  private constraints: Constraint[];

  constructor(constraints: Constraint[] = []) {
    this.constraints = constraints;
  }

  public calculateDiff(
    currentState: any,
    proposedState: any,
  ): StateDiffReport {
    const diff = this.calculateDeepDiff(currentState, proposedState);
    const violations: {
      constraintName: string;
      violationType: "ResourceExceeded" | "TemporalViolation" | "GeneralViolation";
      reason: string;
    }[] = [];

    for (const constraint of this.constraints) {
      let isValid = true;
      let violationType: "ResourceExceeded" | "TemporalViolation" | "GeneralViolation" = "GeneralViolation";
      let reason = "";

      if (constraint instanceof TemporalResourceConstraint) {
        const temporalResult = constraint.checkTemporal(currentState, proposedState, diff);
        if (!temporalResult.isValid) {
          isValid = false;
          violationType = "TemporalViolation";
          reason = temporalResult.reason || "Temporal constraint violated.";
        }

        const resourceResult = constraint.checkResource(currentState, proposedState, diff);
        if (!resourceResult.isValid) {
          isValid = false;
          violationType = "ResourceExceeded";
          reason = resourceResult.reason || "Resource constraint violated.";
        }
      } else {
        const validationResult = constraint.validate(currentState, proposedState, diff);
        if (!validationResult.isValid) {
          isValid = false;
          violationType = "GeneralViolation";
          reason = validationResult.reason || "General constraint violated.";
        }
      }

      if (!isValid) {
        violations.push({
          constraintName: constraint.constructor.name,
          violationType: violationType,
          reason: reason,
        });
      }
    }

    return {
      diff: diff,
      violations: violations,
      isStateValid: violations.length === 0,
    };
  }

  private calculateDeepDiff(oldObj: any, newObj: any): any {
    if (typeof oldObj !== typeof newObj) {
      return { type: "TypeMismatch", old: typeof oldObj, new: typeof newObj };
    }

    if (typeof oldObj !== "object" || oldObj === null || typeof newObj !== "object" || newObj === null) {
      return oldObj !== newObj ? { old: oldObj, new: newObj } : null;
    }

    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const diff: Record<string, any> = {};

    for (const key of keys) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (!keys.has(key)) continue;

      if (typeof oldValue === "object" && oldValue !== null && typeof newValue === "object" && newValue !== null) {
        diff[key] = this.calculateDeepDiff(oldValue, newValue);
      } else if (oldValue !== newValue) {
        diff[key] = { old: oldValue, new: newValue };
      }
    }
    return diff;
  }
}