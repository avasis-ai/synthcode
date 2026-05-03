import { z } from "zod";

type MergeStrategy = "prefer-latest" | "union-all" | "fail-on-conflict";

interface SchemaDefinition {
  [key: string]: z.ZodTypeAny;
}

export class StructuredOutputSchemaMerger {
  private schemas: z.ZodTypeAny[];
  private strategy: MergeStrategy;

  constructor(schemas: z.ZodTypeAny[], strategy: MergeStrategy = "union-all") {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema array cannot be empty.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private resolveTypeConflict(
    existingSchema: z.ZodTypeAny,
    newSchema: z.ZodTypeAny
  ): z.ZodTypeAny {
    const existingSchemaType = existingSchema.constructor.name;
    const newSchemaType = newSchema.constructor.name;

    if (existingSchemaType === newSchemaType) {
      // Simple merge for same type (e.g., two objects)
      if (existingSchema.isObject && newSchema.isObject) {
        return this.mergeObjectSchemas(existingSchema as z.ZodObject, newSchema as z.ZodObject);
      }
      // For primitives, we might just keep the more restrictive one or union them if appropriate.
      // For simplicity in this advanced merger, we'll assume union for primitives if they differ.
      return z.union([existingSchema, newSchema]);
    }

    // Conflict resolution for different types
    switch (this.strategy) {
      case "union-all":
        return z.union([existingSchema, newSchema]);
      case "prefer-latest":
        return newSchema;
      case "fail-on-conflict":
        throw new Error(
          `Type conflict detected: Cannot merge ${existingSchemaType} and ${newSchemaType} using fail-on-conflict strategy.`
        );
      default:
        return z.union([existingSchema, newSchema]);
    }
  }

  private mergeObjectSchemas(
    existing: z.ZodObject,
    newSchema: z.ZodObject
  ): z.ZodObject {
    const mergedSchema: Record<string, z.ZodTypeAny> = {
      ...existing.shape,
    };

    const allKeys = new Set<string>([...Object.keys(existing.shape), ...Object.keys(newSchema.shape)]);

    for (const key of allKeys) {
      const existingProp = existing.shape[key];
      const newProp = newSchema.shape[key];

      if (!existingProp && !newProp) continue;

      if (!existingProp) {
        mergedSchema[key] = newProp;
        continue;
      }

      if (!newProp) {
        // Key exists only in existing, keep it
        continue;
      }

      // Key exists in both, resolve conflict
      mergedSchema[key] = this.resolveTypeConflict(existingProp, newProp);
    }

    return z.object(mergedSchema);
  }

  public merge(): z.ZodTypeAny {
    let mergedSchema: z.ZodObject | undefined = undefined;

    for (const schema of this.schemas) {
      if (!schema.isObject) {
        throw new Error("All input schemas must be Zod objects.");
      }

      const currentSchema = schema as z.ZodObject;

      if (!mergedSchema) {
        mergedSchema = currentSchema;
      } else {
        mergedSchema = this.mergeObjectSchemas(mergedSchema, currentSchema);
      }
    }

    if (!mergedSchema) {
      throw new Error("Failed to merge schemas.");
    }

    return mergedSchema;
  }
}