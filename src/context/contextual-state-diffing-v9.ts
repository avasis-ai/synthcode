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

export interface TemporalResourceConstraint {
  resourceName: string;
  minTimeMs: number;
  maxTimeMs: number;
  requiredResourceLevel: number;
}

export interface DiffResult {
  diff: Record<string, any>;
  violations: string[];
}

export class ContextualStateDiffer {
  private constraints: TemporalResourceConstraint[];

  constructor(constraints: TemporalResourceConstraint[] = []) {
    this.constraints = constraints;
  }

  private validateConstraints(currentState: any, nextState: any): string[] {
    const violations: string[] = [];
    for (const constraint of this.constraints) {
      // Simplified validation logic for demonstration
      if (currentState?.metadata?.[constraint.resourceName] &&
          nextState?.metadata?.[constraint.resourceName]) {
        const currentLevel = currentState.metadata[constraint.resourceName];
        const nextLevel = nextState.metadata[constraint.resourceName];

        if (nextLevel < constraint.requiredResourceLevel) {
          violations.push(
            `Resource ${constraint.resourceName} dropped below required level (${constraint.requiredResourceLevel}). Current: ${nextLevel}`
          );
        }
      }
    }
    return violations;
  }

  private deepDiff(obj1: any, obj2: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      if (!keys1.includes(key) && !keys2.includes(key)) continue;

      if (typeof obj1[key] === 'object' && obj1[key] !== null &&
        typeof obj2[key] === 'object' && obj2[key] !== null) {
        const nestedDiff = this.deepDiff(obj1[key], obj2[key]);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (obj1[key] !== obj2[key]) {
        diff[key] = {
          old: obj1[key],
          new: obj2[key],
        };
      }
    }
    return diff;
  }

  public calculateDiffWithConstraints(
    currentState: any,
    nextState: any
  ): DiffResult {
    const structuralDiff = this.deepDiff(currentState, nextState);
    const constraintViolations = this.validateConstraints(currentState, nextState);

    return {
      diff: structuralDiff,
      violations: constraintViolations,
    };
  }
}