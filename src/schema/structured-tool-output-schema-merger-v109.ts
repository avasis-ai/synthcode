import { z, ZodSchema } from "zod";

type ConflictResolutionStrategy = "prefer-most-specific" | "union-type" | "throw-on-conflict";

interface FieldDefinition {
  schema: ZodSchema<any>;
  sourceSchemaName: string;
}

export class StructuredToolOutputSchemaMerger {
  private schemas: ZodSchema<any>[];
  private strategy: ConflictResolutionStrategy;

  constructor(schemas: ZodSchema<any>[], strategy: ConflictResolutionStrategy) {
    if (!schemas || schemas.length === 0) {
      throw new Error("Must provide at least one schema.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private resolveConflict(
    fieldName: string,
    definitions: FieldDefinition[]
  ): ZodSchema<any> {
    if (definitions.length === 1) {
      return definitions[0].schema;
    }

    const firstSchema = definitions[0].schema;
    const subsequentSchemas = definitions.slice(1).map(d => d.schema);

    if (this.strategy === "union-type") {
      let unionSchema: ZodSchema<any> = firstSchema;
      for (const schema of subsequentSchemas) {
        unionSchema = z.union([unionSchema, schema]);
      }
      return unionSchema;
    }

    if (this.strategy === "prefer-most-specific") {
      // Simple heuristic: prefer the schema that is not a union itself,
      // or the one that seems most restrictive (hard to determine perfectly without deep introspection).
      // For simplicity, we'll just take the first one encountered if we can't merge types easily.
      // A more robust implementation would analyze z.infer<T> for complexity.
      return firstSchema;
    }

    if (this.strategy === "throw-on-conflict") {
      // Check if all schemas are identical (deep comparison is hard, so we check structure)
      const typeStrings = definitions.map(d => d.schema.constructor.name);
      if (typeStrings.every(s => s === definitions[0].schema.constructor.name)) {
        return firstSchema;
      }
      throw new Error(
        `Schema conflict detected for field "${fieldName}" using strategy "${this.strategy}". Multiple differing schemas found.`
      );
    }

    throw new Error("Unknown conflict resolution strategy.");
  }

  public merge(): ZodSchema<any> {
    const mergedSchema = z.object({});
    const fieldMap = new Map<string, FieldDefinition[]>();

    for (const schema of this.schemas) {
      const keys = schema._def.shape;
      for (const fieldName in keys) {
        const key = fieldName as string;
        const fieldSchema = keys[key];

        if (!fieldMap.has(key)) {
          fieldMap.set(key, []);
        }
        fieldMap.get(key)!.push({
          schema: fieldSchema,
          sourceSchemaName: "Unknown", // In a real scenario, we'd track source names better
        });
      }
    }

    const mergedShape: Record<string, ZodSchema<any>> = {};

    for (const [fieldName, definitions] of fieldMap.entries()) {
      try {
        const mergedFieldSchema = this.resolveConflict(fieldName, definitions);
        mergedShape[fieldName] = mergedFieldSchema;
      } catch (e) {
        if (e instanceof Error) {
          throw new Error(`Failed to merge field "${fieldName}": ${e.message}`);
        }
        throw new Error(`An unexpected error occurred while merging field "${fieldName}".`);
      }
    }

    return z.object(mergedShape);
  }
}