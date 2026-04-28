import { z, ZodSchema } from "zod";

type ConflictResolutionStrategy = "prefer_latest" | "union_all" | "require_explicit_merge";

interface SchemaMergerOptions {
  strategy: ConflictResolutionStrategy;
}

class StructuredToolOutputSchemaMerger {
  private readonly options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private resolveConflict(
    key: string,
    schemas: ZodSchema<any>[]
  ): ZodSchema<any> {
    switch (this.options.strategy) {
      case "prefer_latest":
        // For simplicity in this implementation, we'll just take the last schema's definition
        // as the "latest" one, assuming the input array is ordered by preference.
        return schemas[schemas.length - 1];
      case "union_all":
        // Unioning schemas is complex; for basic types, we might try to merge properties.
        // For Zod, a true union requires knowing the structure, but we'll approximate
        // by creating a schema that accepts any structure covered by the inputs.
        // A robust implementation would require deep structural merging.
        return z.object({
          // Placeholder for union logic: In a real scenario, this would iterate
          // over all fields and create a union of possible types for each field.
          __union_placeholder__: z.any(),
        });
      case "require_explicit_merge":
        throw new Error(
          `Conflict detected for field '${key}' with strategy 'require_explicit_merge'. Manual merge required.`
        );
      default:
        throw new Error("Unknown conflict resolution strategy.");
    }
  }

  public merge(schemas: ZodSchema<any>[]): ZodSchema<any> {
    if (schemas.length === 0) {
      return z.any();
    }

    const mergedSchema = z.object({});
    const allKeys = new Set<string>();

    schemas.forEach((schema, index) => {
      // This assumes the input schemas are objects, which is typical for tool outputs.
      if (schema instanceof z.ZodObject) {
        schema.shape.forEach((field, key) => {
          allKeys.add(key);
        });
      }
    });

    for (const key of allKeys) {
      const conflictingSchemas: ZodSchema<any>[] = [];
      let found = false;

      for (const schema of schemas) {
        if (schema instanceof z.ZodObject) {
          const field = schema.shape[key];
          if (field) {
            conflictingSchemas.push(field);
            found = true;
          }
        }
      }

      if (!found) continue;

      let finalFieldSchema: ZodSchema<any>;
      try {
        finalFieldSchema = this.resolveConflict(key, conflictingSchemas);
      } catch (e) {
        if (e instanceof Error) {
          throw new Error(`Schema merging failed for key '${key}': ${e.message}`);
        }
        throw e;
      }

      // Manually assign the resolved schema to the new object shape
      (mergedSchema as any).shape[key] = finalFieldSchema;
    }

    return mergedSchema as unknown as ZodSchema<any>;
  }
}

export { StructuredToolOutputSchemaMerger };