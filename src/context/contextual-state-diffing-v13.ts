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

export interface TemporalContext {
  timestamp: number;
  timeWindowMs: number;
}

export interface TemporalStateDiffCalculator {
  calculateDiff(
    currentState: Record<string, unknown>,
    previousState: Record<string, unknown>,
    context: TemporalContext
  ): Record<string, unknown> | null;
}

class ContextualStateDiffingV13 implements TemporalStateDiffCalculator {
  calculateDiff(
    currentState: Record<string, unknown>,
    previousState: Record<string, unknown>,
    context: TemporalContext
  ): Record<string, unknown> | null {
    const diff: Partial<Record<string, unknown>> = {};
    let hasSignificantDiff = false;

    const keys = new Set([...Object.keys(currentState), ...Object.keys(previousState)]);

    for (const key of keys) {
      const current = currentState[key];
      const previous = previousState[key];

      if (current === undefined && previous === undefined) {
        continue;
      }

      if (current === undefined) {
        diff[key] = undefined;
        continue;
      }

      if (previous === undefined) {
        diff[key] = current;
        hasSignificantDiff = true;
        continue;
      }

      if (typeof current !== typeof previous) {
        diff[key] = current;
        hasSignificantDiff = true;
        continue;
      }

      if (typeof current === 'object' && current !== null && typeof previous === 'object' && previous !== null) {
        if (Array.isArray(current) && Array.isArray(previous)) {
          const arrayDiff = this.diffArrays(current, previous, context, key);
          if (arrayDiff) {
            diff[key] = arrayDiff;
            hasSignificantDiff = true;
          }
        } else if (!Array.isArray(current) && !Array.isArray(previous)) {
          const objectDiff = this.diffObjects(current, previous, context, key);
          if (objectDiff) {
            diff[key] = objectDiff;
            hasSignificantDiff = true;
          }
        } else {
          // Type mismatch between array and object
          diff[key] = current;
          hasSignificantDiff = true;
        }
      } else if (current !== previous) {
        // Primitive value change
        diff[key] = current;
        hasSignificantDiff = true;
      }
    }

    if (!hasSignificantDiff) {
      return null;
    }

    return diff as Record<string, unknown>;
  }

  private diffArrays(
    current: unknown[],
    previous: unknown[],
    context: TemporalContext,
    key: string
  ): Record<string, unknown> | null {
    const diff: Partial<Record<string, unknown>> = {};
    const maxLength = Math.max(current.length, previous.length);

    for (let i = 0; i < maxLength; i++) {
      const currentItem = current[i];
      const previousItem = previous[i];

      if (currentItem === undefined && previousItem === undefined) continue;

      if (currentItem === undefined) {
        diff[`${key}[${i}]`] = undefined;
        continue;
      }

      if (previousItem === undefined) {
        diff[`${key}[${i}]`] = currentItem;
        continue;
      }

      if (typeof currentItem !== typeof previousItem) {
        diff[`${key}[${i}]`] = currentItem;
        continue;
      }

      if (typeof currentItem === 'object' && currentItem !== null && typeof previousItem === 'object' && previousItem !== null) {
        if (Array.isArray(currentItem) && Array.isArray(previousItem)) {
          const nestedDiff = this.diffArrays(
            currentItem as unknown[],
            previousItem as unknown[],
            context,
            `${key}[${i}]`
          );
          if (nestedDiff) {
            Object.assign(diff, nestedDiff);
          }
        } else if (!Array.isArray(currentItem) && !Array.isArray(previousItem)) {
          const nestedDiff = this.diffObjects(
            currentItem as unknown,
            previousItem as unknown,
            context,
            `${key}[${i}]`
          );
          if (nestedDiff) {
            Object.assign(diff, nestedDiff);
          }
        } else {
          diff[`${key}[${i}]`] = currentItem;
        }
      } else if (currentItem !== previousItem) {
        diff[`${key}[${i}]`] = currentItem;
      }
    }

    return Object.keys(diff).length > 0 ? diff as Record<string, unknown> : null;
  }

  private diffObjects(
    current: unknown,
    previous: unknown,
    context: TemporalContext,
    key: string
  ): Record<string, unknown> | null {
    const currentObj = current as Record<string, unknown>;
    const previousObj = previous as Record<string, unknown>;
    const diff: Partial<Record<string, unknown>> = {};
    let hasDiff = false;

    const keys = new Set([...Object.keys(currentObj), ...Object.keys(previousObj)]);

    for (const k of keys) {
      const currentVal = currentObj[k];
      const previousVal = previousObj[k];

      if (currentVal === undefined && previousVal === undefined) continue;

      if (currentVal === undefined) {
        diff[k] = undefined;
        continue;
      }

      if (previousVal === undefined) {
        diff[k] = currentVal;
        hasDiff = true;
        continue;
      }

      if (typeof currentVal !== typeof previousVal) {
        diff[k] = currentVal;
        hasDiff = true;
        continue;
      }

      if (typeof currentVal === 'object' && currentVal !== null && typeof previousVal === 'object' && previousVal !== null) {
        if (Array.isArray(currentVal) && Array.isArray(previousVal)) {
          const nestedDiff = this.diffArrays(
            currentVal as unknown[],
            previousVal as unknown[],
            context,
            `${key}.${k}`
          );
          if (nestedDiff) {
            Object.assign(diff, nestedDiff);
            hasDiff = true;
          }
        } else if (!Array.isArray(currentVal) && !Array.isArray(previousVal)) {
          const nestedDiff = this.diffObjects(
            currentVal as unknown,
            previousVal as unknown,
            context,
            `${key}.${k}`
          );
          if (nestedDiff) {
            Object.assign(diff, nestedDiff);
            hasDiff = true;
          }
        } else {
          diff[k] = currentVal;
          hasDiff = true;
        }
      } else if (currentVal !== previousVal) {
        diff[k] = currentVal;
        hasDiff = true;
      }
    }

    return hasDiff ? diff as Record<string, unknown> : null;
  }
}

export const contextualStateDiffingV13 = new ContextualStateDiffingV13();