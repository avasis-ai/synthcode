import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type DiffOperation = "added" | "deleted" | "modified" | "unchanged";

export interface DiffResult<T> {
  operation: DiffOperation;
  path: string;
  oldValue: T | null;
  newValue: T | null;
  details?: any;
}

export interface DiffableContext {
  serialize(): any;
  compare(other: DiffableContext, strategy: 'semantic' | 'structural' | 'minimal'): DiffResult<any>[];
}

type DiffStrategy = 'semantic' | 'structural' | 'minimal';

export class ContextualStateDiffingService {
  private readonly defaultStrategy: DiffStrategy = 'structural';

  diff(
    oldContext: DiffableContext,
    newContext: DiffableContext,
    strategy: DiffStrategy = this.defaultStrategy
  ): DiffResult<any>[] {
    if (!oldContext || !newContext) {
      throw new Error("Both oldContext and newContext must be provided.");
    }

    if (strategy === 'semantic') {
      return this.diffSemantic(oldContext, newContext);
    }
    if (strategy === 'minimal') {
      return this.diffMinimal(oldContext, newContext);
    }
    return this.diffStructural(oldContext, newContext, strategy);
  }

  private diffStructural(
    oldContext: DiffableContext,
    newContext: DiffableContext,
    strategy: DiffStrategy
  ): DiffResult<any>[] {
    const oldData = oldContext.serialize();
    const newData = newContext.serialize();
    const results: DiffResult<any>[] = [];

    const recursiveDiff = (
      path: string,
      oldObj: any,
      newObj: any
    ): void => {
      if (typeof oldObj !== typeof newObj) {
        results.push({
          operation: "modified",
          path: path,
          oldValue: oldObj,
          newValue: newObj,
          details: "Type mismatch",
        });
        return;
      }

      if (Array.isArray(oldObj) && Array.isArray(newObj)) {
        const arrayDiff = this.diffArray(path, oldObj, newObj);
        results.push(...arrayDiff);
      } else if (typeof oldObj === 'object' && oldObj !== null && typeof newObj === 'object' && newObj !== null) {
        const keysOld = Object.keys(oldObj);
        const keysNew = Object.keys(newObj);
        const allKeys = new Set([...keysOld, ...keysNew]);

        allKeys.forEach(key => {
          const newPath = `${path}.${key}`;
          const oldVal = oldObj[key];
          const newVal = newObj[key];

          if (oldVal === undefined && newVal !== undefined) {
            results.push({ operation: "added", path: newPath, oldValue: null, newValue: newVal });
          } else if (oldVal !== undefined && newVal === undefined) {
            results.push({ operation: "deleted", path: newPath, oldValue: oldVal, newValue: null });
          } else if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
            recursiveDiff(newPath, oldVal, newVal);
          } else if (oldVal !== newVal) {
            results.push({ operation: "modified", path: newPath, oldValue: oldVal, newValue: newVal });
          }
        });
      } else if (oldObj !== newObj) {
        results.push({ operation: "modified", path: path, oldValue: oldObj, newValue: newObj });
      }
    };

    recursiveDiff("root", oldData, newData);
    return results;
  }

  private diffArray(
    path: string,
    oldArray: any[],
    newArray: any[]
  ): DiffResult<any>[] {
    const results: DiffResult<any>[] = [];
    const maxLength = Math.max(oldArray.length, newArray.length);

    for (let i = 0; i < maxLength; i++) {
      const newPath = `${path}[${i}]`;
      const oldItem = oldArray[i];
      const newItem = newArray[i];

      if (oldItem === undefined && newItem !== undefined) {
        results.push({ operation: "added", path: newPath, oldValue: null, newValue: newItem });
      } else if (oldItem !== undefined && newItem === undefined) {
        results.push({ operation: "deleted", path: newPath, oldValue: oldItem, newValue: null });
      } else if (oldItem !== undefined && newItem !== undefined) {
        if (typeof oldItem === 'object' && oldItem !== null && typeof newItem === 'object' && newItem !== null) {
          const subResults = this.diffStructural(
            { serialize: () => oldItem },
            { serialize: () => newItem },
            'structural'
          );
          subResults.forEach(r => {
            r.path = `${newPath}.${r.path.substring(r.path.indexOf('.') + 1)}`;
          });
          results.push(...subResults);
        } else if (oldItem !== newItem) {
          results.push({ operation: "modified", path: newPath, oldValue: oldItem, newValue: newItem });
        }
      }
    }
    return results;
  }

  private diffSemantic(
    oldContext: DiffableContext,
    newContext: DiffableContext
  ): DiffResult<any>[] {
    // Placeholder for complex semantic logic (e.g., graph traversal, intent change detection)
    console.warn("Semantic diffing is a placeholder and relies on custom context implementation.");
    return this.diffStructural(oldContext, newContext, 'structural');
  }

  private diffMinimal(
    oldContext: DiffableContext,
    newContext: DiffableContext
  ): DiffResult<any>[] {
    // Placeholder for minimal diffing (e.g., only tracking top-level changes)
    const oldData = oldContext.serialize();
    const newData = newContext.serialize();

    const minimalDiff: DiffResult<any>[] = [];
    const keysOld = Object.keys(oldData);
    const keysNew = Object.keys(newData);

    const allKeys = new Set([...keysOld, ...keysNew]);

    allKeys.forEach(key => {
      const oldVal = oldData[key];
      const newVal = newData[key];

      if (oldVal === undefined && newVal !== undefined) {
        minimalDiff.push({ operation: "added", path: `root.${key}`, oldValue: null, newValue: newVal });
      } else if (oldVal !== undefined && newVal === undefined) {
        minimalDiff.push({ operation: "deleted", path: `root.${key}`, oldValue: oldVal, newValue: null });
      } else if (oldVal !== newVal) {
        minimalDiff.push({ operation: "modified", path: `root.${key}`, oldValue: oldVal, newValue: newVal });
      }
    });

    return minimalDiff;
  }
}