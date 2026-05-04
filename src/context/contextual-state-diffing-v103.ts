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

export type SemanticChangeType =
  | "structural_diff"
  | "value_diff"
  | "causally_implied"
  | "semantically_equivalent";

export interface StateDiffPayload {
  path: string;
  changeType: SemanticChangeType;
  oldValue: unknown;
  newValue: unknown;
  description: string;
}

export type StateDiff = StateDiffPayload[];

export class ContextualStateDiffer {
  private readonly maxDepth: number;

  constructor(maxDepth: number = 10) {
    this.maxDepth = maxDepth;
  }

  private isDeepEqual(a: unknown, b: unknown): boolean {
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return a === b;

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    const keysA = Object.keys(aObj);
    const keysB = Object.keys(bObj);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      const valA = aObj[key];
      const valB = bObj[key];

      if (typeof valA === 'object' && valA !== null && typeof valB === 'object' && valB !== null) {
        if (!this.isDeepEqual(valA, valB)) return false;
      } else if (valA !== valB) {
        return false;
      }
    }
    return true;
  }

  private traverseAndDiff(
    currentPath: string,
    oldState: unknown,
    newState: unknown,
    diffs: StateDiff[],
    depth: number
  ): void {
    if (depth > this.maxDepth) return;

    if (typeof oldState !== 'object' || typeof newState !== 'object' || oldState === null || newState === null) {
      if (oldState !== newState) {
        diffs.push({
          path: currentPath,
          changeType: "value_diff",
          oldValue: oldState,
          newValue: newState,
          description: `Primitive value changed from ${String(oldState)} to ${String(newState)}.`,
        });
      }
      return;
    }

    const oldObj = oldState as Record<string, unknown>;
    const newObj = newState as Record<string, unknown>;
    const oldKeys = Object.keys(oldObj);
    const newKeys = Object.keys(newObj);
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const newPath = `${currentPath}/${key}`;
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (!(key in oldObj)) {
        diffs.push({
          path: newPath,
          changeType: "structural_diff",
          oldValue: undefined,
          newValue: newValue,
          description: `New field added: ${key}.`,
        });
        continue;
      }

      if (!(key in newObj)) {
        diffs.push({
          path: newPath,
          changeType: "structural_diff",
          oldValue: oldValue,
          newValue: undefined,
          description: `Field removed: ${key}.`,
        });
        continue;
      }

      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          this.diffArray(newPath, oldValue, newValue, diffs, depth + 1);
        } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
          this.traverseAndDiff(newPath, oldValue, newValue, diffs, depth + 1);
        } else {
          this.diffPrimitive(newPath, oldValue, newValue, diffs);
        }
      } else {
        this.diffPrimitive(newPath, oldValue, newValue, diffs);
      }
    }
  }

  private diffArray(
    currentPath: string,
    oldArray: unknown[],
    newArray: unknown[],
    diffs: StateDiff[],
    depth: number
  ): void {
    const minLength = Math.min(oldArray.length, newArray.length);
    const maxLength = Math.max(oldArray.length, newArray.length);

    // Check for length change
    if (oldArray.length !== newArray.length) {
      diffs.push({
        path: currentPath,
        changeType: "structural_diff",
        oldValue: oldArray.length,
        newValue: newArray.length,
        description: `Array length changed from ${oldArray.length} to ${newArray.length}.`,
      });
    }

    // Compare elements up to the minimum length
    for (let i = 0; i < minLength; i++) {
      const itemPath = `${currentPath}[${i}]`;
      const oldItem = oldArray[i];
      const newItem = newArray[i];

      if (typeof oldItem === 'object' && oldItem !== null && typeof newItem === 'object' && newItem !== null) {
        if (Array.isArray(oldItem) && Array.isArray(newItem)) {
          this.diffArray(itemPath, oldItem, newItem, diffs, depth + 1);
        } else if (typeof oldItem === 'object' && typeof newItem === 'object') {
          this.traverseAndDiff(itemPath, oldItem, newItem, diffs, depth + 1);
        } else {
          this.diffPrimitive(itemPath, oldItem, newItem, diffs);
        }
      } else {
        this.diffPrimitive(itemPath, oldItem, newItem, diffs);
      }
    }

    // Check for added/removed elements after minLength
    for (let i = minLength; i < maxLength; i++) {
      const itemPath = `${currentPath}[${i}]`;
      const oldItem = oldArray[i];
      const newItem = newArray[i];

      if (i >= oldArray.length) {
        diffs.push({
          path: itemPath,
          changeType: "structural_diff",
          oldValue: undefined,
          newValue: newItem,
          description: `Array element added at index ${i}.`,
        });
      } else if (i >= newArray.length) {
        diffs.push({
          path: itemPath,
          changeType: "structural_diff",
          oldValue: oldItem,
          newValue: undefined,
          description: `Array element removed at index ${i}.`,
        });
      }
    }
  }

  private diffPrimitive(
    currentPath: string,
    oldValue: unknown,
    newValue: unknown,
    diffs: StateDiff[]
  ): void {
    if (oldValue === newValue) {
      return;
    }

    if (typeof oldValue === 'string' && typeof newValue === 'string' && oldValue.length > 0 && newValue.length > 0) {
      if (oldValue.includes(newValue) || newValue.includes(oldValue)) {
        diffs.push({
          path: currentPath,
          changeType: "semantically_equivalent",
          oldValue: oldValue,
          newValue: newValue,
          description: "Strings are semantically equivalent (substring relationship detected).",
        });
        return;
      }
    }

    if (oldValue === undefined || newValue === undefined) {
      // Handled by structural checks, but good for safety
      return;
    }

    diffs.push({
      path: currentPath,
      changeType: "value_diff",
      oldValue: oldValue,
      newValue: newValue,
      description: `Value changed from ${String(oldValue)} to ${String(newValue)}.`,
    });
  }

  /**
   * Performs a deep, contextual diff between two state objects.
   * @param oldState The previous state.
   * @param newState The current state.
   * @returns An array of StateDiffPayload detailing all changes.
   */
  public diff(oldState: unknown, newState: unknown): StateDiff {
    const diffs: StateDiff[] = [];
    this.traverseAndDiff("", oldState, newState, diffs, 0);
    return diffs;
  }
}