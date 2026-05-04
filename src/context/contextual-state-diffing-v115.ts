import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextualStateDiffingV115Options {
  criticalFields: string[];
}

export interface ContextualStateDiffPayload {
  diff: Record<string, any>;
  criticalChanges: Record<string, any>;
}

export class ContextualStateDiffingV115Service {
  private options: ContextualStateDiffingV115Options;

  constructor(options: ContextualStateDiffingV115Options) {
    this.options = options;
  }

  private calculateDeepDiff(obj1: any, obj2: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
        const nestedDiff = this.calculateDeepDiff(val1, val2);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (val1 !== val2) {
        diff[key] = { old: val1, new: val2 };
      }
    }
    return diff;
  }

  public calculateDiff(
    currentState: Record<string, any>,
    nextState: Record<string, any>
  ): ContextualStateDiffPayload {
    const standardDiff = this.calculateDeepDiff(currentState, nextState);
    const criticalChanges: Record<string, any> = {};
    const criticalFieldsSet = new Set(this.options.criticalFields);

    for (const key in standardDiff) {
      if (criticalFieldsSet.has(key)) {
        const diffValue = standardDiff[key];
        if (typeof diffValue === 'object' && diffValue !== null && 'new' in diffValue) {
          criticalChanges[key] = diffValue.new;
        } else if (diffValue !== undefined) {
          criticalChanges[key] = diffValue;
        }
      }
    }

    return {
      diff: standardDiff,
      criticalChanges: criticalChanges,
    };
  }
}