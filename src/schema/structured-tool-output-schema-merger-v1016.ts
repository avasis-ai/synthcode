import { z } from "zod";

export enum ConflictResolutionStrategy {
  PRIORITIZE_SOURCE = "PRIORITIZE_SOURCE",
  WEIGHTED_MERGE = "WEIGHTED_MERGE",
  FIRST_WINS = "FIRST_WINS",
}

export interface SchemaSource {
  schema: z.ZodTypeAny;
  sourceName: string;
  priority: number;
}

export class StructuredToolOutputSchemaMergerV1016 {
  private sources: SchemaSource[];
  private strategy: ConflictResolutionStrategy;

  constructor(sources: SchemaSource[], strategy: ConflictResolutionStrategy) {
    if (!sources || sources.length === 0) {
      throw new Error("Schema sources cannot be empty.");
    }
    this.sources = sources;
    this.strategy = strategy;
  }

  private resolveConflict(
    key: string,
    values: { source: SchemaSource; value: unknown }[]
  ): z.ZodTypeAny {
    if (values.length === 1) {
      return values[0].source.schema;
    }

    switch (this.strategy) {
      case ConflictResolutionStrategy.FIRST_WINS:
        return values[0].source.schema;

      case ConflictResolutionStrategy.PRIORITIZE_SOURCE:
        // Sort by priority (higher number = higher priority)
        const sortedSources = [...values].sort((a, b) => b.source.priority - a.source.priority);
        return sortedSources[0].source.schema;

      case ConflictResolutionStrategy.WEIGHTED_MERGE:
        // Simplified weighted merge: For complex types, we'll prioritize the union of fields
        // and use the highest priority source's definition for conflicting fields.
        const mergedObjectSchema = z.object({});
        const fieldMap = new Map<string, { schema: z.ZodTypeAny; source: SchemaSource }>();

        for (const { source: sourceSchema, value: valueData } of values) {
          if (typeof valueData === "object" && valueData !== null) {
            const currentSchema = sourceSchema as z.ZodObject;
            if (currentSchema.shape) {
              for (const [key, fieldSchema] of Object.entries(currentSchema.shape)) {
                const fieldSchemaInstance = fieldSchema as z.ZodTypeAny;
                if (!fieldMap.has(key) || sourceSchema.priority > fieldMap.get(key)!.source.priority) {
                  fieldMap.set(key, { schema: fieldSchemaInstance, source: sourceSchema });
                }
              }
            }
          }
        }

        const finalShape: Record<string, z.ZodTypeAny> = {};
        for (const [key, { schema: finalSchema }] of fieldMap.entries()) {
          finalShape[key] = finalSchema;
        }

        return z.object(finalShape);

      default:
        throw new Error("Unsupported conflict resolution strategy.");
    }
  }

  public mergeSchemas(): z.ZodTypeAny {
    let mergedSchema: z.ZodTypeAny = z.object({});

    for (const source of this.sources) {
      const currentSchema = source.schema;

      if (currentSchema instanceof z.ZodObject) {
        const currentShape = currentSchema.shape;
        const newShape: Record<string, z.ZodTypeAny> = {};

        for (const [key, fieldSchema] of Object.entries(currentShape)) {
          const existingFieldSchema = (mergedSchema as z.ZodObject).shape[key];

          if (existingFieldSchema) {
            // Conflict detected or field exists, resolve it
            const conflictValues: { source: SchemaSource; value: unknown }[] = [
              { source: source, value: fieldSchema },
              { source: { schema: existingFieldSchema, sourceName: "merged", priority: -1 }, value: existingFieldSchema },
            ];
            const resolvedSchema = this.resolveConflict(key, conflictValues);
            newShape[key] = resolvedSchema;
          } else {
            // No conflict, just add the field
            newShape[key] = fieldSchema;
          }
        }

        // Merge the new shape into the existing merged schema
        const updatedMergedSchema = z.object({
          ...((mergedSchema as z.ZodObject).shape),
          ...newShape,
        });
        mergedSchema = updatedMergedSchema as z.ZodTypeAny;

      } else {
        // Handle non-object schemas (e.g., if the whole output is just a string)
        // For simplicity in this advanced merger, we assume the primary output is an object.
        console.warn("Skipping non-object source schema during merge.");
      }
    }

    return mergedSchema;
  }
}