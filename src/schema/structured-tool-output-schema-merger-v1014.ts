import { z, ZodSchema } from "zod";

export enum MergeStrategy {
  PreferLatest = "prefer_latest",
  UnionFields = "union_fields",
  ErrorOnConflict = "error_on_conflict",
}

export interface SchemaMergerOptions {
  strategy: MergeStrategy;
}

export class StructuredToolOutputSchemaMerger {
  private readonly options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private resolveConflict(
    key: string,
    existingSchema: ZodSchema<any>,
    newSchema: ZodSchema<any>
  ): ZodSchema<any> {
    const strategy = this.options.strategy;

    switch (strategy) {
      case MergeStrategy.PreferLatest:
        return newSchema;
      case MergeStrategy.UnionFields:
        // Simple union: combine all fields from both schemas.
        // This is a simplification; a real implementation would deep-merge Zod schemas.
        return z.object({
          ...existingSchema.shape,
          ...newSchema.shape,
        });
      case MergeStrategy.ErrorOnConflict:
        throw new Error(
          `Schema conflict detected for field '${key}' using strategy ${strategy}. Manual review required.`
        );
    }
  }

  public mergeSchemas(schemas: ZodSchema<any>[]): ZodSchema<any> {
    if (!schemas || schemas.length === 0) {
      throw new Error("Cannot merge an empty array of schemas.");
    }

    let mergedSchema: ZodSchema<any> = z.object({});

    for (let i = 0; i < schemas.length; i++) {
      const currentSchema = schemas[i];

      if (i === 0) {
        mergedSchema = currentSchema;
        continue;
      }

      const currentShape = mergedSchema.shape;
      const newShape = currentSchema.shape;

      for (const key in newShape) {
        const newFieldSchema = newShape[key];
        const existingFieldSchema = currentShape[key];

        if (existingFieldSchema) {
          // Conflict detected
          mergedSchema = this.resolveConflict(
            key,
            existingFieldSchema,
            newFieldSchema
          );
        } else {
          // No conflict, add the new field
          mergedSchema = mergedSchema.extend({
            [key]: newFieldSchema,
          });
        }
      }
    }

    return mergedSchema;
  }
}