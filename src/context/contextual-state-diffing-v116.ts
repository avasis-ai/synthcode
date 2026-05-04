import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type TemporalResourceConstraint = {
  maxTimeDeltaMs: number;
  maxCpuUsageThreshold: number;
};

export interface StateDiffReport {
  diff: Record<string, any>;
  constraintsApplied: TemporalResourceConstraint;
  isSignificantChange: boolean;
  reason: string;
}

export class ContextualStateDiffingV116Service {
  private constraints: TemporalResourceConstraint;

  constructor(constraints: TemporalResourceConstraint) {
    this.constraints = constraints;
  }

  private validateConstraints(currentState: any, nextState: any): boolean {
    const { maxTimeDeltaMs, maxCpuUsageThreshold } = this.constraints;

    if (Math.abs(Date.now() - currentState.timestamp) > maxTimeDeltaMs) {
      console.warn("Constraint Violation: Time delta exceeded.");
      return false;
    }

    // Simplified CPU usage check simulation
    const cpuUsage = this.calculateSimulatedCpuUsage(currentState, nextState);
    if (cpuUsage > maxCpuUsageThreshold) {
      console.warn("Constraint Violation: CPU usage threshold exceeded.");
      return false;
    }

    return true;
  }

  private calculateSimulatedCpuUsage(currentState: any, nextState: any): number {
    // Placeholder logic: complexity based on state size difference
    const sizeDiff = Math.abs(JSON.stringify(currentState).length - JSON.stringify(nextState).length);
    return Math.min(100, sizeDiff / 1000);
  }

  private deepDiff(oldObj: any, newObj: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of keys) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        const nestedDiff = this.deepDiff(oldValue, newValue);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (oldValue !== newValue) {
        diff[key] = { old: oldValue, new: newValue };
      }
    }
    return diff;
  }

  public diffState(currentState: any, nextState: any): StateDiffReport {
    if (!this.validateConstraints(currentState, nextState)) {
      return {
        diff: {},
        constraintsApplied: this.constraints,
        isSignificantChange: false,
        reason: "Diffing aborted due to constraint violation (Time/Resource)."
      };
    }

    const structuralDiff = this.deepDiff(currentState, nextState);
    const isSignificant = Object.keys(structuralDiff).length > 0;

    let reason = "State updated successfully.";
    if (!isSignificant) {
      reason = "No detectable structural changes.";
    }

    return {
      diff: structuralDiff,
      constraintsApplied: this.constraints,
      isSignificantChange: isSignificant,
      reason: reason
    };
  }
}