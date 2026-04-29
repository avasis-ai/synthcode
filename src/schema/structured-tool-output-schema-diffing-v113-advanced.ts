import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type DiffType =
  | "TYPE_MISMATCH"
  | "FIELD_REMOVED"
  | "FIELD_ADDED"
  | "STRUCTURAL_CHANGE"
  | "VALUE_CHANGE";

export interface DiffDetail {
  path: string;
  diffType: DiffType;
  oldValue: unknown;
  newValue: unknown;
  message: string;
}

export interface SchemaDiffReport {
  diffs: DiffDetail[];
}

type Schema = Record<string, unknown>;

export class SchemaDiffer {
  private diffs: DiffDetail[] = [];

  private recordDiff(
    path: string,
    oldSchema: unknown,
    newSchema: unknown
  ): void {
    if (typeof oldSchema !== "object" || oldSchema === null || typeof newSchema !== "object" || newSchema === null) {
      if (oldSchema !== newSchema) {
        this.diffs.push({
          path,
          diffType: "VALUE_CHANGE",
          oldValue: oldSchema,
          newValue: newSchema,
          message: "Primitive value changed.",
        });
      }
      return;
    }

    const oldObject = oldSchema as Record<string, unknown>;
    const newObject = newSchema as Record<string, unknown>;

    const allKeys = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const oldValue = oldObject[key];
      const newValue = newObject[key];

      if (oldObject[key] === undefined) {
        if (newObject[key] !== undefined) {
          this.diffs.push({
            path: currentPath,
            diffType: "FIELD_ADDED",
            oldValue: undefined,
            newValue: newValue,
            message: `Field '${key}' was added.`,
          });
        }
      } else if (newObject[key] === undefined) {
        this.diffs.push({
          path: currentPath,
          diffType: "FIELD_REMOVED",
          oldValue: oldValue,
          newValue: undefined,
          message: `Field '${key}' was removed.`,
        });
      } else {
        if (typeof oldValue === "object" && oldValue !== null && !Array.isArray(oldValue) &&
          typeof newValue === "object" && newValue !== null && !Array.isArray(newValue)) {
          this.recordDiff(currentPath, oldValue, newValue);
        } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          this.recordArrayDiff(currentPath, oldValue, newValue);
        } else if (typeof oldValue !== typeof newValue || (typeof oldValue === "object" && typeof newValue === "object" && (Array.isArray(oldValue) !== Array.isArray(newValue)))) {
          this.diffs.push({
            path: currentPath,
            diffType: "TYPE_MISMATCH",
            oldValue: oldValue,
            newValue: newValue,
            message: `Type mismatch detected. Old type: ${typeof oldValue}, New type: ${typeof newValue}.`,
          });
        } else if (oldValue !== newValue) {
          this.diffs.push({
            path: currentPath,
            diffType: "VALUE_CHANGE",
            oldValue: oldValue,
            newValue: newValue,
            message: `Primitive value changed.`,
          });
        }
      }
    }
  }

  private recordArrayDiff(
    path: string,
    oldArray: unknown[],
    newArray: unknown[]
  ): void {
    if (oldArray.length !== newArray.length) {
      this.diffs.push({
        path,
        diffType: "STRUCTURAL_CHANGE",
        oldValue: oldArray.length,
        newValue: newArray.length,
        message: `Array length changed from ${oldArray.length} to ${newArray.length}.`,
      });
    }

    const minLength = Math.min(oldArray.length, newArray.length);
    for (let i = 0; i < minLength; i++) {
      const currentPath = `${path}[${i}]`;
      const oldItem = oldArray[i];
      const newItem = newArray[i];

      if (typeof oldItem === "object" && oldItem !== null && !Array.isArray(oldItem) &&
        typeof newItem === "object" && newItem !== null && !Array.isArray(newItem)) {
        this.recordDiff(currentPath, oldItem, newItem);
      } else if (Array.isArray(oldItem) && Array.isArray(newItem)) {
        this.recordArrayDiff(currentPath, oldItem, newItem);
      } else if (oldItem !== newItem) {
        this.diffs.push({
          path: currentPath,
          diffType: "VALUE_CHANGE",
          oldValue: oldItem,
          newValue: newItem,
          message: `Array item value changed at index ${i}.`,
        });
      }
    }

    if (oldArray.length > newArray.length) {
      this.diffs.push({
        path,
        diffType: "FIELD_REMOVED",
        oldValue: oldArray.length,
        newValue: newArray.length,
        message: `${oldArray.length - newArray.length} items removed from array at path ${path}.`,
      });
    } else if (newArray.length > oldArray.length) {
      this.diffs.push({
        path,
        diffType: "FIELD_ADDED",
        oldValue: oldArray.length,
        newValue: newArray.length,
        message: `${newArray.length - oldArray.length} items added to array at path ${path}.`,
      });
    }
  }

  public diff(oldSchema: unknown, newSchema: unknown): SchemaDiffReport {
    this.diffs = [];
    this.recordDiff("root", oldSchema, newSchema);
    return { diffs: this.diffs };
  }
}