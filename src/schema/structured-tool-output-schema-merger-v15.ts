import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Schema = Record<string, any>;

export enum ConflictResolutionStrategy {
  PreferLatest = "prefer_latest",
  UnionAll = "union_all",
  MergeByType = "merge_by_type",
}

export class StructuredToolOutputSchemaMergerV15 {
  private strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy) {
    this.strategy = strategy;
  }

  private resolveConflict(
    key: string,
    schemaA: any,
    schemaB: any
  ): any {
    switch (this.strategy) {
      case ConflictResolutionStrategy.PreferLatest:
        // In a real scenario, 'latest' would imply temporal order.
        // Here, we arbitrarily prefer schemaB as the 'later' one.
        return schemaB;
      case ConflictResolutionStrategy.UnionAll:
        // Merge properties from both, preferring non-null/undefined values.
        return { ...schemaA, ...schemaB };
      case ConflictResolutionStrategy.MergeByType:
        // This is complex; for simplicity, we'll recursively merge if both are objects,
        // otherwise, we'll use union logic.
        if (typeof schemaA === 'object' && schemaA !== null && typeof schemaB === 'object' && schemaB !== null) {
          const merged: Record<string, any> = {};
          const allKeys = new Set([...Object.keys(schemaA), ...Object.keys(schemaB)]);
          for (const k of allKeys) {
            const valA = schemaA[k];
            const valB = schemaB[k];

            if (typeof valA === 'object' && valA !== null && typeof valB === 'object' && valB !== null) {
              merged[k] = this.resolveConflict(k, valA, valB);
            } else if (valB !== undefined) {
              merged[k] = valB;
            } else {
              merged[k] = valA;
            }
          }
          return merged;
        }
        return { ...schemaA, ...schemaB };
      default:
        return schemaB;
    }
  }

  public mergeSchemas(
    schemaA: Schema,
    schemaB: Schema
  ): Schema {
    const mergedSchema: Schema = {};
    const allKeys = new Set([...Object.keys(schemaA), ...Object.keys(schemaB)]);

    for (const key of allKeys) {
      const schemaAValue = schemaA[key];
      const schemaBValue = schemaB[key];

      if (schemaAValue === undefined) {
        mergedSchema[key] = schemaBValue;
      } else if (schemaBValue === undefined) {
        mergedSchema[key] = schemaAValue;
      } else {
        mergedSchema[key] = this.resolveConflict(key, schemaAValue, schemaBValue);
      }
    }

    return mergedSchema;
  }
}