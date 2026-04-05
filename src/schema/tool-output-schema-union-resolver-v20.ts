import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaResolver {
  resolve(schemas: Record<string, any[]>): any;
}

export enum ConflictResolutionStrategy {
  STRICT,
  UNION_MERGE,
  LATEST_WINS,
}

export class ToolOutputSchemaUnionResolverV20 implements SchemaResolver {
  private strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.UNION_MERGE) {
    this.strategy = strategy;
  }

  resolve(schemas: Record<string, any[]>): any {
    const resolvedSchema: Record<string, any> = {};

    for (const key in schemas) {
      if (!schemas.hasOwnProperty(key)) continue;

      const schemaList = schemas[key];
      if (!schemaList || schemaList.length === 0) {
        resolvedSchema[key] = null;
        continue;
      }

      const mergedSchema = this.mergeSchemas(schemaList);
      resolvedSchema[key] = mergedSchema;
    }

    return resolvedSchema;
  }

  private mergeSchemas(schemas: any[]): any {
    if (schemas.length === 0) {
      return {};
    }

    let merged: Record<string, any> = {};

    for (const schema of schemas) {
      if (typeof schema !== 'object' || schema === null) continue;

      for (const key in schema) {
        if (!schema.hasOwnProperty(key)) continue;

        const currentSchemaValue = schema[key];
        const existingValue = merged[key];

        if (existingValue === undefined) {
          merged[key] = currentSchemaValue;
        } else {
          merged[key] = this.resolveConflict(
            key,
            existingValue,
            currentSchemaValue
          );
        }
      }
    }

    return merged;
  }

  private resolveConflict(
    key: string,
    existing: any,
    newSchema: any
  ): any {
    switch (this.strategy) {
      case ConflictResolutionStrategy.STRICT:
        if (this.isTypeConflict(existing, newSchema)) {
          throw new Error(
            `Schema conflict detected for key "${key}": Cannot merge types strictly. Existing: ${JSON.stringify(existing)}, New: ${JSON.stringify(newSchema)}`
          );
        }
        return this.deepMerge(existing, newSchema);

      case ConflictResolutionStrategy.UNION_MERGE:
        return this.unionMerge(existing, newSchema);

      case ConflictResolutionStrategy.LATEST_WINS:
        return newSchema;
    }
  }

  private isTypeConflict(a: any, b: any): boolean {
    // Simplified type conflict check for demonstration
    const typeA = typeof a;
    const typeB = typeof b;

    if (typeA !== typeB) {
      return true;
    }
    return false;
  }

  private deepMerge(a: any, b: any): any {
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return b;
    }

    const result: any = { ...a, ...b };

    for (const key in b) {
      if (b.hasOwnProperty(key)) {
        if (typeof a[key] === 'object' && a[key] !== null && typeof b[key] === 'object' && b[key] !== null) {
          result[key] = this.deepMerge(a[key], b[key]);
        } else {
          result[key] = b[key];
        }
      }
    }
    return result;
  }

  private unionMerge(existing: any, newSchema: any): any {
    // In a real scenario, this would involve complex JSON Schema union logic.
    // Here, we simulate merging by preferring the union of properties.
    const merged: any = { ...existing, ...newSchema };

    // Simple heuristic: if both define a property, we treat it as a union of possibilities.
    for (const key in newSchema) {
      if (existing.hasOwnProperty(key)) {
        // Placeholder for actual union logic (e.g., merging type definitions)
        (merged as any)[key] = {
          type: "union",
          options: [existing[key], newSchema[key]],
        };
      }
    }
    return merged;
  }
}