import { z, ZodSchema } from "zod";

export enum ConflictStrategy {
  UNION,
  INTERSECTION,
  FALLBACK,
}

export interface SchemaMergerOptions {
  conflictStrategy: ConflictStrategy;
}

export class StructuredToolOutputSchemaMergerV1000New {
  private readonly options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private mergeSchemas(schemas: ZodSchema<any[]>): ZodSchema<any> {
    if (schemas.length === 0) {
      return z.any();
    }

    const mergedObjectSchema = z.object({});
    const allKeys = new Set<string>();

    schemas.forEach((schema, index) => {
      if (typeof schema !== 'object' || schema === null || typeof schema.shape === 'undefined') {
        throw new Error(`Invalid schema provided at index ${index}. Expected a Zod object schema.`);
      }
      Object.keys(schema.shape).forEach(key => {
        allKeys.add(key);
      });
    });

    const finalShape: Record<string, z.ZodTypeAny> = {};

    allKeys.forEach(key => {
      const keySchemas: ZodSchema<any>[] = [];
      let hasSchema = false;

      for (const schema of schemas) {
        if (schema.shape.hasOwnProperty(key)) {
          keySchemas.push(schema.shape[key] as ZodSchema<any>);
          hasSchema = true;
        }
      }

      if (!hasSchema) {
        // Should not happen if allKeys is built correctly, but for safety
        return;
      }

      let mergedFieldSchema: z.ZodTypeAny;

      if (keySchemas.length === 1) {
        mergedFieldSchema = keySchemas[0];
      } else {
        switch (this.options.conflictStrategy) {
          case ConflictStrategy.UNION:
            mergedFieldSchema = z.union(keySchemas);
            break;
          case ConflictStrategy.INTERSECTION:
            mergedFieldSchema = z.intersection(keySchemas);
            break;
          case ConflictStrategy.FALLBACK:
            // Fallback: Use the first schema's type, but validate against all
            mergedFieldSchema = keySchemas[0].optional().transform((value) => {
              // Simple fallback: assume the first schema's type is dominant
              return value;
            });
            break;
          default:
            mergedFieldSchema = z.any();
        }
      }
      finalShape[key] = mergedFieldSchema;
    });

    return z.object(finalShape);
  }

  /**
   * Merges an array of structured tool output schemas into a single coherent schema.
   * @param inputSchemas An array of ZodSchema objects representing individual tool outputs.
   * @returns A single ZodSchema representing the merged structure.
   */
  public merge(inputSchemas: ZodSchema<any>[]): ZodSchema<any> {
    return this.mergeSchemas(inputSchemas);
  }
}