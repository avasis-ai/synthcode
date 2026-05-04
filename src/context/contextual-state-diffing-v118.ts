import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ChangeType = "added" | "removed" | "modified" | "type_mismatch" | "structure_changed";

export interface DiffReport {
  path: string;
  changeType: ChangeType;
  oldValue: unknown;
  newValue: unknown;
  message: string;
}

export type DiffResult = DiffReport[];

export class ContextualStateDiffer {
  private readonly initialDiff: DiffResult = [];

  diff(oldState: unknown, newState: unknown): DiffResult {
    return this.recursiveDiff(oldState, newState, "");
  }

  private recursiveDiff(oldValue: unknown, newValue: unknown, path: string): DiffResult {
    const diff: DiffResult = [];

    if (typeof oldValue !== typeof newValue) {
      diff.push({
        path: path,
        changeType: "type_mismatch",
        oldValue: oldValue,
        newValue: newValue,
        message: `Type mismatch at path '${path}'. Old type: ${typeof oldValue}, New type: ${typeof newValue}.`,
      });
      return diff;
    }

    const oldIsObject = typeof oldValue === 'object' && oldValue !== null;
    const newIsObject = typeof newValue === 'object' && newValue !== null;

    if (!oldIsObject || !newIsObject) {
      if (oldValue !== newValue) {
        diff.push({
          path: path,
          changeType: "modified",
          oldValue: oldValue,
          newValue: newValue,
          message: `Value changed at path '${path}'.`,
        });
      }
      return diff;
    }

    const oldObject = oldValue as Record<string, unknown>;
    const newObject = newValue as Record<string, unknown>;

    const oldKeys: string[] = Object.keys(oldObject);
    const newKeys: string[] = Object.keys(newObject);
    const allKeys: Set<string> = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const oldExists = oldObject.hasOwnProperty(key);
      const newExists = newObject.hasOwnProperty(key);

      if (oldExists && !newExists) {
        diff.push({
          path: currentPath,
          changeType: "removed",
          oldValue: oldObject[key],
          newValue: undefined,
          message: `Field '${key}' removed at path '${path}'.`,
        });
      } else if (!oldExists && newExists) {
        diff.push({
          path: currentPath,
          changeType: "added",
          oldValue: undefined,
          newValue: newObject[key],
          message: `Field '${key}' added at path '${path}'.`,
        });
      } else if (oldExists && newExists) {
        const oldVal = oldObject[key];
        const newVal = newObject[key];

        if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
          const nestedDiff = this.recursiveDiff(oldVal, newVal, currentPath);
          diff.push(...nestedDiff);
        } else if (oldVal !== newVal) {
          diff.push({
            path: currentPath,
            changeType: "modified",
            oldValue: oldVal,
            newValue: newVal,
            message: `Value modified at path '${path}'.`,
          });
        }
      }
    }

    return diff;
  }
}