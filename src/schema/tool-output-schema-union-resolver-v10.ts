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

export enum ConflictResolutionStrategy {
  MERGE,
  PREFER_FIRST,
  PREFER_LATEST,
  THROW,
}

export interface SchemaResolver<T> {
  resolve(schemas: T[]): T;
}

export interface ToolOutputSchemaUnionResolverV10 extends SchemaResolver<any> {
  resolve(schemas: any[], strategy: ConflictResolutionStrategy): any;
}

export class ToolOutputSchemaUnionResolverV10Impl implements ToolOutputSchemaUnionResolverV10 {
  resolve(schemas: any[], strategy: ConflictResolutionStrategy): any {
    if (!schemas || schemas.length === 0) {
      return {};
    }

    const mergedSchema: Record<string, any> = {};

    for (const schema of schemas) {
      if (typeof schema !== 'object' || schema === null) {
        continue;
      }

      for (const key in schema) {
        if (!Object.prototype.hasOwnProperty.call(schema, key)) {
          continue;
        }

        const currentSchemaValue = schema[key];
        const existingSchemaValue = mergedSchema[key];

        if (existingSchemaValue === undefined) {
          mergedSchema[key] = currentSchemaValue;
        } else {
          if (typeof currentSchemaValue === 'object' && currentSchemaValue !== null &&
            typeof existingSchemaValue === 'object' && existingSchemaValue !== null) {
            if (Array.isArray(currentSchemaValue) && Array.isArray(existingSchemaValue)) {
              mergedSchema[key] = this.resolveArrayUnion(
                currentSchemaValue,
                existingSchemaValue,
                strategy
              );
            } else if (typeof currentSchemaValue === 'object' && typeof existingSchemaValue === 'object') {
              // Simple object merge for non-array, non-primitive types
              mergedSchema[key] = this.mergeObjects(
                currentSchemaValue,
                existingSchemaValue,
                strategy
              );
            } else {
              // Primitive type conflict resolution
              mergedSchema[key] = this.resolvePrimitiveConflict(
                currentSchemaValue,
                existingSchemaValue,
                strategy
              );
            }
          } else {
            mergedSchema[key] = this.resolvePrimitiveConflict(
              currentSchemaValue,
              existingSchemaValue,
              strategy
            );
          }
        }
      }
    }

    return mergedSchema;
  }

  private resolvePrimitiveConflict(
    newVal: any,
    oldVal: any,
    strategy: ConflictResolutionStrategy
  ): any {
    switch (strategy) {
      case ConflictResolutionStrategy.PREFER_FIRST:
        return oldVal;
      case ConflictResolutionStrategy.PREFER_LATEST:
        return newVal;
      case ConflictResolutionStrategy.THROW:
        if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
          throw new Error(
            `Schema conflict detected for type: ${typeof newVal} vs ${typeof oldVal}. Strategy: THROW`
          );
        }
        return newVal;
      case ConflictResolutionStrategy.MERGE:
      default:
        // For primitives, MERGE usually means PREFER_LATEST or PREFER_FIRST based on context.
        // Here, we default to PREFER_LATEST for simplicity in schema merging.
        return newVal;
    }
  }

  private resolveArrayUnion(
    newArr: any[],
    oldArr: any[],
    strategy: ConflictResolutionStrategy
  ): any[] {
    if (strategy === ConflictResolutionStrategy.THROW) {
      throw new Error(
        'Cannot merge arrays with THROW strategy. Union must be explicit.'
      );
    }

    if (strategy === ConflictResolutionStrategy.PREFER_FIRST) {
      return oldArr;
    }

    if (strategy === ConflictResolutionStrategy.PREFER_LATEST) {
      return newArr;
    }

    // MERGE strategy for arrays: Concatenate unique elements if they are primitives,
    // otherwise, we treat it as a union of types, which is complex.
    // For simplicity in this resolver, we concatenate and deduplicate based on JSON stringify.
    const combined = [...oldArr, ...newArr];
    const seen = new Set<string>();
    const unique = [];

    for (const item of combined) {
      const key = JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  }

  private mergeObjects(
    newObj: any,
    oldObj: any,
    strategy: ConflictResolutionStrategy
  ): any {
    const merged: Record<string, any> = { ...oldObj };

    for (const key in newObj) {
      if (!Object.prototype.hasOwnProperty.call(newObj, key)) {
        continue;
      }

      const newVal = newObj[key];
      const oldVal = oldObj[key];

      if (oldVal === undefined) {
        merged[key] = newVal;
      } else if (typeof newVal === 'object' && newVal !== null &&
        typeof oldVal === 'object' && oldVal !== null) {
        if (Array.isArray(newVal) && Array.isArray(oldVal)) {
          merged[key] = this.resolveArrayUnion(
            newVal,
            oldVal,
            strategy
          );
        } else {
          merged[key] = this.mergeObjects(
            newVal,
            oldVal,
            strategy
          );
        }
      } else {
        merged[key] = this.resolvePrimitiveConflict(
          newVal,
          oldVal,
          strategy
        );
      }
    }
    return merged;
  }
}

export const ToolOutputSchemaUnionResolverV10: ToolOutputSchemaUnionResolverV10 = new ToolOutputSchemaUnionResolverV10Impl();