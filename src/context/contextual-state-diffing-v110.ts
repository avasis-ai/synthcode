import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Constraint {
  key: string;
  validator: (currentState: any, newState: any) => boolean;
  errorMessage: string;
}

export interface DecayWeight {
  key: string;
  weight: number;
}

export interface DiffReport {
  rawChanges: Record<string, any>;
  decayImpact: Record<string, number>;
  constraintViolations: Record<string, string[]>;
}

abstract class BaseStateDiffingService<T> {
  abstract diff(oldState: T, newState: T): DiffReport;
}

export class ContextualStateDiffingV110 extends BaseStateDiffingService<any> {
  private constraints: Constraint[];
  private decayWeights: DecayWeight[];

  constructor(constraints: Constraint[] = [], decayWeights: DecayWeight[] = []) {
    super();
    this.constraints = constraints;
    this.decayWeights = decayWeights;
  }

  private calculateDecayImpact(oldState: any, newState: any): Record<string, number> {
    const decayImpact: Record<string, number> = {};
    for (const { key, weight } of this.decayWeights) {
      const oldValue = oldState[key];
      const newValue = newState[key];
      if (oldValue !== undefined && newValue !== undefined) {
        const difference = Math.abs(oldValue - newValue);
        decayImpact[key] = difference * weight;
      } else {
        decayImpact[key] = 0;
      }
    }
    return decayImpact;
  }

  private validateConstraints(oldState: any, newState: any): Record<string, string[]> {
    const violations: Record<string, string[]> = {};
    for (const constraint of this.constraints) {
      if (!constraint.validator(oldState, newState)) {
        if (!violations[constraint.key]) {
          violations[constraint.key] = [];
        }
        violations[constraint.key].push(constraint.errorMessage);
      }
    }
    return violations;
  }

  diff(oldState: any, newState: any): DiffReport {
    const rawChanges: Record<string, any> = {};
    const decayImpact = this.calculateDecayImpact(oldState, newState);
    const constraintViolations = this.validateConstraints(oldState, newState);

    // Simple structural diff for rawChanges (placeholder logic)
    const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
    for (const key of keys) {
      if (oldState[key] !== newState[key]) {
        rawChanges[key] = {
          old: oldState[key],
          new: newState[key],
        };
      }
    }

    return {
      rawChanges,
      decayImpact,
      constraintViolations,
    };
  }
}