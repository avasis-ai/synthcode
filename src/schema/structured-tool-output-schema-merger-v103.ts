import { z, ZodTypeAny, ZodSchema } from "zod";

export type MergeStrategy = "prefer-latest" | "prefer-earliest" | "merge-compatible" | "fail-on-conflict";

export interface MergeOptions {
  strategy: MergeStrategy;
}

export interface SchemaMerger {
  mergeSchemas(schemas: ZodSchema<any>[], options: MergeOptions): ZodSchema<any>;
}

export class StructuredToolOutputSchemaMergerV103 implements SchemaMerger {
  mergeSchemas(schemas: ZodSchema<any>[], options: MergeOptions): ZodSchema<any> {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema list cannot be empty.");
    }

    let currentSchema: ZodSchema<any> = schemas[0];

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i];
      currentSchema = this.merge(currentSchema, nextSchema, options);
    }

    return currentSchema;
  }

  private merge(schemaA: ZodSchema<any>, schemaB: ZodSchema<any>, options: MergeOptions): ZodSchema<any> {
    const mergedObject = {
      _super: {
        merge: (a: any, b: any, opts: MergeOptions) => {
          const mergedSchema = z.object({});

          const keysA = Object.keys(a);
          const keysB = Object.keys(b);
          const allKeys = [...new Set([...keysA, ...keysB])];

          for (const key of allKeys) {
            const schemaAExists = (a as any)[key] !== undefined;
            const schemaBExists = (b as any)[key] !== undefined;

            if (!schemaAExists && !schemaBExists) continue;

            let finalSchema: ZodSchema<any> | undefined;

            if (schemaAExists && schemaBExists) {
              const mergedField = this.mergeField(
                (a as any)[key],
                (b as any)[key],
                options
              );
              finalSchema = mergedField;
            } else if (schemaAExists) {
              finalSchema = (a as any)[key];
            } else {
              finalSchema = (b as any)[key];
            }

            if (finalSchema) {
              mergedSchema.extend({
                [key]: finalSchema,
              });
            }
          }
          return mergedSchema;
        },
      },
    };

    return z.object(mergedObject._super.merge(schemaA, schemaB, options));
  }

  private mergeField(fieldA: any, fieldB: any, options: MergeOptions): ZodSchema<any> {
    const strategy = options.strategy;

    if (typeof fieldA === 'object' && fieldA !== null && typeof fieldB === 'object' && fieldB !== null) {
      if (fieldA instanceof ZodSchema && fieldB instanceof ZodSchema) {
        if (strategy === "merge-compatible") {
          return this.merge(fieldA, fieldB, options);
        }
        if (strategy === "fail-on-conflict") {
          // For simplicity, we treat any conflict in nested objects as a failure if not explicitly merged
          return z.any(); // Placeholder for complex conflict handling
        }
      }
    }

    switch (strategy) {
      case "prefer-latest":
        return fieldB instanceof ZodSchema ? fieldB : fieldA;
      case "prefer-earliest":
        return fieldA instanceof ZodSchema ? fieldA : fieldB;
      case "merge-compatible":
        // This case is handled above for ZodSchema types, but for primitives, we might just take the union or the most restrictive.
        return z.union([fieldA, fieldB]);
      case "fail-on-conflict":
        // If types conflict and we fail, we might return a union or throw, but for schema merging, we'll default to the union of possibilities.
        return z.union([fieldA, fieldB]);
      default:
        return z.any();
    }
  }
}

export const createSchemaMerger = (options: MergeOptions): StructuredToolOutputSchemaMergerV103 => {
  return new StructuredToolOutputSchemaMergerV103();
};