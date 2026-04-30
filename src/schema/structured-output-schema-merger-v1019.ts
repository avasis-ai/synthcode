import { z, ZodSchema } from "zod";

type ConflictStrategy = "prefer-latest" | "union-all" | "strict-intersection";

interface SchemaDefinition {
  name: string;
  schema: z.ZodTypeAny;
}

export class StructuredOutputSchemaMerger {
  private schemas: SchemaDefinition[];

  constructor(schemas: SchemaDefinition[]) {
    this.schemas = schemas;
  }

  private getFieldType(schema: z.ZodTypeAny): string {
    if (schema.constructor.name === "ZodString") return "string";
    if (schema.constructor.name === "ZodNumber") return "number";
    if (schema.constructor.name === "ZodBoolean") return "boolean";
    if (schema.constructor.name === "ZodObject") return "object";
    return "unknown";
  }

  private mergeObjectSchemas(
    schema1: z.ZodObject<any>,
    schema2: z.ZodObject<any>,
    strategy: ConflictStrategy
  ): z.ZodObject<any> {
    const mergedSchema = z.object({});
    const allKeys = new Set<string>();
    const keys1 = Object.keys(schema1.shape);
    const keys2 = Object.keys(schema2.shape);

    keys1.forEach(key => allKeys.add(key as string));
    keys2.forEach(key => allKeys.add(key as string));

    for (const key of allKeys) {
      const keyStr = key as string;
      const schema1Exists = schema1.shape[keyStr];
      const schema2Exists = schema2.shape[keyStr];

      if (!schema1Exists && !schema2Exists) continue;

      let finalSchema: z.ZodTypeAny | undefined;

      if (schema1Exists && schema2Exists) {
        switch (strategy) {
          case "prefer-latest":
            finalSchema = schema2Exists;
            break;
          case "union-all":
            // For union-all, we attempt to merge the underlying types if possible,
            // but for simplicity and safety with Zod, we'll prioritize the union of types.
            finalSchema = z.union([schema1Exists, schema2Exists]);
            break;
          case "strict-intersection":
            // Intersection is complex for Zod types; we'll use a union as a fallback
            // or require manual refinement if strict intersection logic is needed.
            // For this implementation, we'll use union for safety.
            finalSchema = z.union([schema1Exists, schema2Exists]);
            break;
        }
      } else if (schema1Exists) {
        finalSchema = schema1Exists;
      } else {
        finalSchema = schema2Exists;
      }

      if (finalSchema) {
        mergedSchema = mergedSchema.extend({
          [keyStr]: finalSchema,
        });
      }
    }
    return mergedSchema;
  }

  public merge(strategy: ConflictStrategy): z.ZodObject<any> {
    if (this.schemas.length === 0) {
      return z.object({});
    }

    let currentSchema: z.ZodObject<any> = this.schemas[0].schema.pick({});

    for (let i = 1; i < this.schemas.length; i++) {
      const nextSchema = this.schemas[i].schema.pick({});
      if (typeof nextSchema !== 'object' || nextSchema === null) {
        throw new Error("Schema must be an object type.");
      }
      currentSchema = this.mergeObjectSchemas(currentSchema, nextSchema, strategy);
    }

    return currentSchema;
  }
}

export { StructuredOutputSchemaMerger, ConflictStrategy };