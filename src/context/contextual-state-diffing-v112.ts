import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Constraint = {
  key: string;
  check: (current: any, previous: any) => boolean;
};

export interface TemporalResourceConstraint extends Constraint {
  startTime?: number;
  endTime?: number;
  maxResourceUsage?: number;
  checkResourceViolation(current: any, previous: any, resourceUsage: number): boolean;
}

export interface StateDiffReport {
  path: string;
  currentValue: any;
  previousValue: any;
  isDifferent: boolean;
  violationReason?: string;
}

class ContextualStateDiffingV112 {
  private constraints: TemporalResourceConstraint[];

  constructor(constraints: TemporalResourceConstraint[]) {
    this.constraints = constraints;
  }

  private checkConstraints(path: string, currentValue: any, previousValue: any): { isDifferent: boolean; violationReason?: string } {
    for (const constraint of this.constraints) {
      if (path.includes("message")) {
        if (constraint.key === "message") {
          if (!constraint.check(currentValue, previousValue)) {
            return { isDifferent: false, violationReason: `Constraint violation at ${path}: ${constraint.key} check failed.` };
          }
        }
      }
      // Simplified resource check simulation for demonstration
      if (constraint.maxResourceUsage !== undefined) {
        const simulatedUsage = Math.abs(currentValue.length - previousValue.length) || 0;
        if (simulatedUsage > constraint.maxResourceUsage!) {
          return { isDifferent: false, violationReason: `Resource violation at ${path}: Exceeded max usage of ${constraint.maxResourceUsage!}.` };
        }
      }
    }
    return { isDifferent: true };
  }

  public diff(currentState: any, previousState: any): StateDiffReport[] {
    const reports: StateDiffReport[] = [];
    this.recursiveDiff(currentState, previousState, "", reports);
    return reports;
  }

  private recursiveDiff(current: any, previous: any, path: string, reports: StateDiffReport[]): void {
    if (typeof current !== 'object' || current === null || typeof previous !== 'object' || previous === null) {
      if (current !== previous) {
        const { isDifferent: constrainedDiff, violationReason } = this.checkConstraints(path, current, previous);
        reports.push({
          path,
          currentValue: current,
          previousValue: previous,
          isDifferent: constrainedDiff,
          violationReason: violationReason,
        });
      }
      return;
    }

    const currentKeys = Object.keys(current);
    const previousKeys = Object.keys(previous);
    const allKeys = new Set([...currentKeys, ...previousKeys]);

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      const currentVal = current[key];
      const previousVal = previous[key];

      if (typeof currentVal === 'object' && currentVal !== null && typeof previousVal === 'object' && previousVal !== null) {
        this.recursiveDiff(currentVal, previousVal, newPath, reports);
      } else if (currentVal !== previousVal) {
        const { isDifferent: constrainedDiff, violationReason } = this.checkConstraints(newPath, currentVal, previousVal);
        reports.push({
          path: newPath,
          currentValue: currentVal,
          previousValue: previousVal,
          isDifferent: constrainedDiff,
          violationReason: violationReason,
        });
      }
    }
  }
}

export { ContextualStateDiffingV112 };