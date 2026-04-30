import { z } from "zod";

export enum SchemaMergeStrategy {
  MostSpecific = "most-specific",
  LatestDefinition = "latest-definition",
  ManualOverride = "manual-override",
}

export interface SchemaDefinition {
  schema: z.ZodTypeAny;
  source: string;
  priority: number;
}

export interface SchemaMergerOptions {
  strategy: SchemaMergeStrategy;
}

export class StructuredToolOutputSchemaMerger {
  private options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private resolveConflict(
    existingSchema: z.ZodTypeAny,
    newSchema: z.ZodTypeAny,
    source: string,
    priority: number
  ): z.ZodTypeAny {
    switch (this.options.strategy) {
      case SchemaMergeStrategy.MostSpecific:
        // In a real scenario, this would involve deep structural comparison
        // For simplicity, we'll assume the one with higher priority wins,
        // or if priorities are equal, we might prefer the one that adds more fields.
        if (priority > 0) { // Placeholder logic: assume higher priority wins
          return newSchema;
        }
        return existingSchema;

      case SchemaMergeStrategy.LatestDefinition:
        // Latest definition is usually the last one processed, but here we use priority as proxy
        return newSchema;

      case SchemaMergeStrategy.ManualOverride:
        // Manual override implies external logic, here we just take the new one if it's explicitly marked
        if (priority > 100) { // Arbitrary high number for 'manual'
          return newSchema;
        }
        return existingSchema;

      default:
        return existingSchema;
    }
  }

  public mergeSchemas(
    schemas: SchemaDefinition[]
  ): z.ZodTypeAny {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema definitions array cannot be empty.");
    }

    let mergedSchema: z.ZodTypeAny = z.object({});

    // Sort schemas based on priority (descending) to process most important first
    const sortedSchemas = [...schemas].sort((a, b) => b.priority - a.priority);

    for (const definition of sortedSchemas) {
      const currentSchema = definition.schema;
      const source = definition.source;
      const priority = definition.priority;

      if (mergedSchema.constructor.name === 'ZodObject') {
        // Attempt to merge fields from the current schema into the accumulated object schema
        const fields = currentSchema.shape;
        const newFields: Record<string, z.ZodTypeAny> = {};

        for (const [key, fieldSchema] of Object.entries(fields)) {
          const existingField = mergedSchema.shape[key];

          if (existingField) {
            // Conflict resolution logic for individual fields
            const resolvedField = this.resolveConflict(
              existingField,
              fieldSchema,
              source,
              priority
            );
            newFields[key] = resolvedField;
          } else {
            // No conflict, just add the new field
            newFields[key] = fieldSchema;
          }
        }

        // Recreate the merged object schema with updated fields
        mergedSchema = z.object({ ...mergedSchema.shape, ...newFields });
      } else {
        // If the initial mergedSchema wasn't an object (shouldn't happen if initialized correctly)
        mergedSchema = currentSchema;
      }
    }

    return mergedSchema;
  }
}