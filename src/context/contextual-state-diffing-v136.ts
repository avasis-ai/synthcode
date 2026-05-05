import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TemporalResourceConstraint {
  decayRate: number;
  resourceWeight: Record<string, number>;
}

export interface ContextualStateDiffReport {
  diff: Record<string, any>;
  decayImpactScore: number;
  resourceOverheadScore: number;
  isSignificantDrift: boolean;
}

export class ContextualStateDiffer {
  private readonly constraint: TemporalResourceConstraint;

  constructor(constraint: TemporalResourceConstraint) {
    this.constraint = constraint;
  }

  private calculateDecayImpact(oldState: any, newState: any): number {
    let totalDecay = 0;
    const decayRate = this.constraint.decayRate;

    if (!oldState || !newState) return 0;

    const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of keys) {
      const oldValue = oldState[key];
      const newValue = newState[key];

      if (oldValue !== undefined && newValue !== undefined && oldValue !== newValue) {
        // Simple decay model: difference magnitude * decay rate
        const differenceMagnitude = Math.abs(oldValue - newValue) || 1;
        totalDecay += differenceMagnitude * decayRate;
      } else if (oldValue === undefined && newValue !== undefined) {
        // New state component contributes to decay if it's 'new'
        totalDecay += 0.1 * decayRate;
      }
    }
    return totalDecay;
  }

  private calculateResourceOverhead(oldState: any, newState: any): number {
    let totalOverhead = 0;
    const resourceWeights = this.constraint.resourceWeight;

    const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of keys) {
      const oldValue = oldState[key];
      const newValue = newState[key];

      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        // Simulate resource cost based on object depth/size change
        const sizeDiff = Math.abs(JSON.stringify(oldValue).length - JSON.stringify(newValue).length);
        if (resourceWeights['size_change']) {
          totalOverhead += sizeDiff * resourceWeights['size_change'];
        }
      } else if (oldValue !== newValue) {
        // Simple change cost
        if (resourceWeights['change']) {
          totalOverhead += resourceWeights['change'];
        }
      }
    }
    return totalOverhead;
  }

  public calculateDiff(oldState: any, newState: any): ContextualStateDiffReport {
    const diff: Record<string, any> = {};
    let totalDecay = 0;
    let totalOverhead = 0;

    const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of keys) {
      const oldValue = oldState[key];
      const newValue = newState[key];

      if (oldValue !== newValue) {
        diff[key] = {
          old: oldValue,
          new: newValue,
          changed: true,
        };
      } else {
        diff[key] = {
          old: oldValue,
          new: newValue,
          changed: false,
        };
      }
    }

    totalDecay = this.calculateDecayImpact(oldState, newState);
    totalOverhead = this.calculateResourceOverhead(oldState, newState);

    const isSignificantDrift = totalDecay > 10 || totalOverhead > 5;

    return {
      diff: diff,
      decayImpactScore: totalDecay,
      resourceOverheadScore: totalOverhead,
      isSignificantDrift: isSignificantDrift,
    };
  }
}