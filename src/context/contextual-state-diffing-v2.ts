import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type DiffChangeType =
  | "added_field"
  | "removed_field"
  | "updated_value"
  | "type_changed"
  | "added_item"
  | "removed_item";

export interface DiffChange {
  path: string;
  type: DiffChangeType;
  oldValue?: unknown;
  newValue?: unknown;
  message: string;
}

export interface ContextDiff {
  changes: DiffChange[];
}

export class ContextManager {
  private context: Record<string, unknown>;

  constructor(initialContext: Record<string, unknown> = {}) {
    this.context = initialContext;
  }

  public setContext(newContext: Record<string, unknown>): void {
    this.context = newContext;
  }

  public getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  public diffContextV2(oldContext: Record<string, unknown>, newContext: Record<string, unknown>): ContextDiff {
    const changes: DiffChange[] = [];

    const deepDiff = (
      path: string,
      oldValue: unknown,
      newValue: unknown,
      changesAcc: DiffChange[]
    ): void => {
      if (typeof oldValue !== typeof newValue) {
        changesAcc.push({
          path,
          type: "type_changed",
          oldValue,
          newValue,
          message: `Type changed from ${typeof oldValue} to ${typeof newValue}.`,
        });
        return;
      }

      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        const oldLen = oldValue.length;
        const newLen = newValue.length;
        const minLen = Math.min(oldLen, newLen);

        // Check for changes in existing elements
        for (let i = 0; i < minLen; i++) {
          deepDiff(`${path}[${i}]`, (oldValue as any)[i], (newValue as any)[i], changesAcc);
        }

        // Check for additions/removals in array length
        if (oldLen < newLen) {
          for (let i = oldLen; i < newLen; i++) {
            changesAcc.push({
              path: `${path}[${i}]`,
              type: "added_item",
              newValue: (newValue as any)[i],
              message: `Item added at index ${i}.`,
            });
          }
        } else if (oldLen > newLen) {
          for (let i = newLen; i < oldLen; i++) {
            changesAcc.push({
              path: `${path}[${i}]`,
              type: "removed_item",
              oldValue: (oldValue as any)[i],
              message: `Item removed from index ${i}.`,
            });
          }
        }
        return;
      }

      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null && !Array.isArray(oldValue) && !Array.isArray(newValue)) {
        const oldKeys = Object.keys(oldValue);
        const newKeys = Object.keys(newValue);
        const allKeys = new Set([...oldKeys, ...newKeys]);

        for (const key of allKeys) {
          const currentPath = path ? `${path}['${key}']` : `'${key}'`;
          const oldVal = (oldValue as Record<string, unknown>)[key];
          const newVal = (newValue as Record<string, unknown>)[key];

          if (!(key in oldValue)) {
            changesAcc.push({
              path: currentPath,
              type: "added_field",
              newValue: newVal,
              message: `Field '${key}' added.`,
            });
          } else if (!(key in newValue)) {
            changesAcc.push({
              path: currentPath,
              type: "removed_field",
              oldValue: oldVal,
              message: `Field '${key}' removed.`,
            });
          } else if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null && !Array.isArray(oldVal) && !Array.isArray(newVal)) {
            deepDiff(currentPath, oldVal, newVal, changesAcc);
          } else if (oldVal !== newVal) {
            changesAcc.push({
              path: currentPath,
              type: "updated_value",
              oldValue: oldVal,
              newValue: newVal,
              message: `Value updated for field '${key}'.`,
            });
          }
        }
        return;
      }

      if (oldValue !== newValue) {
        changesAcc.push({
          path: path,
          type: "updated_value",
          oldValue,
          newValue,
          message: `Value changed from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}.`,
        });
      }
    };

    deepDiff(
      "",
      oldContext,
      newContext,
      changes
    );

    return { changes };
  }
}