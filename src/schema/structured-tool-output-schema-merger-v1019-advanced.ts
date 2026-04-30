import { z, ZodSchema } from "zod";

export enum MergeStrategy {
  UNION = "UNION",
  INTERSECTION = "INTERSECTION",
  PREFER_LATEST = "PREFER_LATEST",
}

export interface SchemaMergerOptions {
  strategies: Record<string, MergeStrategy>;
}

export class StructuredToolOutputSchemaMerger {
  private options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private mergeObjectSchemas(
    schemas: ZodSchema<any>[],
    strategy: MergeStrategy
  ): ZodSchema<any> {
    if (schemas.length === 0) {
      return z.any();
    }

    if (strategy === MergeStrategy.UNION) {
      return z.object(
        z.record(z.any()).merge(
          ...schemas.map(s => s.shape)
        )
      );
    }

    if (strategy === MergeStrategy.INTERSECTION) {
      const mergedShape: Record<string, z.ZodTypeAny> = {};
      for (const schema of schemas) {
        const shape = schema.shape;
        for (const key in shape) {
          if (!(key in mergedShape)) {
            mergedShape[key] = shape[key];
          } else {
            mergedShape[key] = z.intersection(
              mergedShape[key] as z.ZodTypeAny,
              shape[key]
            );
          }
        }
      }
      return z.object(mergedShape);
    }

    if (strategy === MergeStrategy.PREFER_LATEST) {
      // For simplicity in this advanced merger, PREFER_LATEST will just use the last schema's structure
      // when merging top-level object properties, but for deep merging, it's complex.
      // We'll default to a union of all properties found, favoring the last definition if keys clash.
      const lastSchema = schemas[schemas.length - 1];
      return z.object(lastSchema.shape);
    }

    return z.any();
  }

  private mergeArraySchemas(
    schemas: ZodSchema<any>[],
    strategy: MergeStrategy
  ): z.ZodArray<any> {
    if (schemas.length === 0) {
      return z.array(z.any());
    }

    let innerSchema: z.ZodTypeAny = z.any();

    if (strategy === MergeStrategy.UNION) {
      const unionSchema = z.object(
        z.record(z.any()).merge(
          ...schemas.map(s => s.shape)
        )
      );
      innerSchema = unionSchema;
    } else if (strategy === MergeStrategy.INTERSECTION) {
      const intersectionShape: Record<string, z.ZodTypeAny> = {};
      for (const schema of schemas) {
        const shape = schema.shape;
        for (const key in shape) {
          if (!(key in intersectionShape)) {
            intersectionShape[key] = shape[key];
          } else {
            intersectionShape[key] = z.intersection(
              intersectionShape[key] as z.ZodTypeAny,
              shape[key]
            );
          }
        }
      }
      innerSchema = z.object(intersectionShape);
    } else if (strategy === MergeStrategy.PREFER_LATEST) {
      innerSchema = schemas[schemas.length - 1].shape;
    }

    return z.array(innerSchema);
  }

  public mergeSchemas(
    schemas: ZodSchema<any>[],
    fieldStrategies: Record<string, MergeStrategy>
  ): ZodSchema<any> {
    if (schemas.length === 0) {
      return z.any();
    }

    const mergedShape: Record<string, z.ZodTypeAny> = {};

    for (const schema of schemas) {
      const shape = schema.shape;
      for (const key in shape) {
        const currentSchema = shape[key];
        const strategy = fieldStrategies[key] || MergeStrategy.UNION;

        if (!(key in mergedShape)) {
          mergedShape[key] = currentSchema;
          continue;
        }

        const existingSchema = mergedShape[key];

        if (existingSchema instanceof z.ZodObject && currentSchema instanceof z.ZodObject) {
          // Handle nested objects recursively (simplified for this scope)
          const nestedStrategies = {
            "object": MergeStrategy.UNION, // Default nested strategy
          };
          const mergedNested = this.mergeSchemas(
            [existingSchema, currentSchema],
            nestedStrategies
          );
          mergedShape[key] = mergedNested;
        } else if (existingSchema instanceof z.ZodArray && currentSchema instanceof z.ZodArray) {
          // Handle arrays
          const arrayStrategies = {
            "items": strategy, // Use the field strategy for array items
          };
          const mergedArray = this.mergeSchemas(
            [existingSchema, currentSchema],
            arrayStrategies
          );
          mergedShape[key] = mergedArray;
        } else {
          // Handle primitive or conflicting types using the specified strategy
          const mergedType = this.mergeObjectSchemas(
            [existingSchema, currentSchema],
            strategy
          );
          mergedShape[key] = mergedType;
        }
      }
    }

    return z.object(mergedShape);
  }
}

export { StructuredToolOutputSchemaMerger, MergeStrategy };