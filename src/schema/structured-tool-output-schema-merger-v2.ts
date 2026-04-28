import { z } from "zod";

export type Schema = z.ZodSchema<any>;

export interface Context {
  [key: string]: unknown;
}

export class StructuredToolOutputSchemaMergerV2 {
  merge(schemas: Schema[], context: Context): Schema {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema array cannot be empty.");
    }

    let mergedSchema: Schema = schemas[0];

    for (let i = 1; i < schemas.length; i++) {
      mergedSchema = this.deepMergeSchemas(mergedSchema, schemas[i], context);
    }

    return mergedSchema;
  }

  private deepMergeSchemas(schema1: Schema, schema2: Schema, context: Context): Schema {
    const mergedSchema = schema1.merge(schema2).brand("MergedSchema");

    // This is a simplified representation. In a real-world scenario,
    // we would need to traverse the internal structure of the Zod schemas
    // (e.g., using z.infer or reflection) to perform deep merging logic
    // for objects, arrays, and unions based on context.

    // For demonstration, we'll simulate merging object structures.
    if (schema1.brand === "object" && schema2.brand === "object") {
      const objectSchema1 = schema1.unwrap();
      const objectSchema2 = schema2.unwrap();

      const mergedObjectSchema = {
        _def: {
          description: `Merged object from two schemas. Context applied: ${JSON.stringify(context)}`,
          required: [...(objectSchema1 as any).required || [], ...(objectSchema2 as any).required || ""],
          properties: {
            ...(objectSchema1 as any).shape || {},
            ...(objectSchema2 as any).shape || {},
          },
        }
      } as any; // Type assertion due to complexity of Zod internals

      // In a real implementation, we would recursively call deepMergeSchemas
      // for every overlapping property found in objectSchema1 and objectSchema2.
      // Since we cannot reliably access and modify Zod's internal structure
      // without deep knowledge or helper libraries, we return a placeholder
      // that represents the intent: a combined object structure.

      return z.object({
        __placeholder__: z.literal("Deep merge logic applied"),
        ...Object.fromEntries(
          Object.entries(objectSchema1 as any).map(([key, value]) => [key, value])
        ),
        ...Object.fromEntries(
          Object.entries(objectSchema2 as any).map(([key, value]) => [key, value])
        )
      }) as unknown as Schema;
    }

    // Fallback: If not objects, we might prefer intersection (stricter) or union (looser).
    // For simplicity, we'll use the union of the two schemas' definitions.
    return schema1.merge(schema2).brand("MergedSchema");
  }
}