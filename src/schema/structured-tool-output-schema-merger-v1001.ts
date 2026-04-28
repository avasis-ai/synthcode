import { z } from "zod";

export enum ConflictStrategy {
  UNION,
  PREFER_LATEST,
  FAIL_FAST,
}

export interface SchemaMergerOptions {
  conflictStrategy: ConflictStrategy;
}

export type Schema = z.ZodTypeAny;

export class StructuredToolOutputSchemaMerger {
  private options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private resolveConflict(
    key: string,
    schemaA: Schema,
    schemaB: Schema,
  ): Schema {
    switch (this.options.conflictStrategy) {
      case ConflictStrategy.UNION:
        return this.unionSchemas(key, schemaA, schemaB);
      case ConflictStrategy.PREFER_LATEST:
        return schemaB;
      case ConflictStrategy.FAIL_FAST:
        throw new Error(
          `Schema conflict detected for field '${key}' with strategy FAIL_FAST. Cannot merge schemas.`
        );
    }
  }

  private unionSchemas(
    key: string,
    schemaA: Schema,
    schemaB: Schema,
  ): Schema {
    // Simplified union logic: For complex schemas, a full union requires deep merging
    // of all possible types/structures. Here, we prioritize merging object structures.
    if (schemaA instanceof z.ZodObject && schemaB instanceof z.ZodObject) {
      const mergedObject = z.object({});
      const keysA = Object.keys(schemaA.shape);
      const keysB = Object.keys(schemaB.shape);
      const allKeys = [...new Set([...keysA, ...keysB])];

      const mergedShape: Record<string, z.ZodTypeAny> = {};

      for (const key of allKeys) {
        const schemaAExists = (schemaA.shape as any)[key];
        const schemaBExists = (schemaB.shape as any)[key];

        if (schemaAExists && schemaBExists) {
          mergedShape[key] = this.resolveConflict(key, schemaAExists, schemaBExists);
        } else if (schemaAExists) {
          mergedShape[key] = schemaAExists;
        } else if (schemaBExists) {
          mergedShape[key] = schemaBExists;
        }
      }
      return z.object(mergedShape);
    }
    // Fallback for non-object types: prefer the union of possible types if possible,
    // but for simplicity in this context, we'll just use the union type if available.
    return z.union([schemaA, schemaB]);
  }

  public merge(
    schemaA: Schema,
    schemaB: Schema,
  ): Schema {
    if (!(schemaA instanceof z.ZodObject) || !(schemaB instanceof z.ZodObject)) {
      throw new Error("Both input schemas must be ZodObject instances for merging.");
    }

    const mergedShape: Record<string, z.ZodTypeAny> = {};
    const keysA = Object.keys(schemaA.shape);
    const keysB = Object.keys(schemaB.shape);
    const allKeys = [...new Set([...keysA, ...keysB])];

    for (const key of allKeys) {
      const schemaAExists = (schemaA.shape as any)[key];
      const schemaBExists = (schemaB.shape as any)[key];

      if (schemaAExists && schemaBExists) {
        mergedShape[key] = this.resolveConflict(key, schemaAExists, schemaBExists);
      } else if (schemaAExists) {
        mergedShape[key] = schemaAExists;
      } else if (schemaBExists) {
        mergedShape[key] = schemaBExists;
      }
    }

    return z.object(mergedShape);
  }
}

export function createSchemaMerger(
  options: SchemaMergerOptions = { conflictStrategy: ConflictStrategy.UNION }
): StructuredToolOutputSchemaMerger {
  return new StructuredToolOutputSchemaMerger(options);
}