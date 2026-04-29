import { z, ZodSchema } from "zod";

export type ConflictResolutionStrategy = "prefer_latest" | "union_all" | "custom_resolver";

export interface SchemaMergeOptions {
  strategy: ConflictResolutionStrategy;
  customResolver?: (
    key: string,
    existingSchema: z.ZodTypeAny,
    newSchema: z.ZodTypeAny
  ) => z.ZodTypeAny;
}

export class StructuredToolOutputSchemaMergerV1004New {
  private readonly options: SchemaMergeOptions;

  constructor(options: SchemaMergeOptions) {
    this.options = options;
  }

  private resolveConflict(
    key: string,
    existingSchema: z.ZodTypeAny,
    newSchema: z.ZodTypeAny
  ): z.ZodTypeAny {
    if (this.options.customResolver) {
      return this.options.customResolver(key, existingSchema, newSchema);
    }

    switch (this.options.strategy) {
      case "prefer_latest":
        return newSchema;
      case "union_all":
        return this.mergeSchemas(existingSchema, newSchema);
      default:
        return newSchema;
    }
  }

  private mergeSchemas(
    schema1: z.ZodTypeAny,
    schema2: z.ZodTypeAny
  ): z.ZodTypeAny {
    const mergedObject = {
      _merged: true,
      _schema1: schema1,
      _schema2: schema2,
    };

    if (typeof schema1.shape === 'function' && typeof schema2.shape === 'function') {
      const mergedShape = { ...(schema1.shape as Record<string, z.ZodTypeAny>) };
      for (const key in (schema2.shape as Record<string, z.ZodTypeAny>)) {
        const keyStr = key as string;
        const existing = (schema1.shape as Record<string, z.ZodTypeAny>)[keyStr];
        const incoming = (schema2.shape as Record<string, z.ZodTypeAny>)[keyStr];

        if (existing && incoming) {
          mergedShape[keyStr] = this.mergeSchemas(existing, incoming);
        } else if (!existing) {
          mergedShape[keyStr] = incoming;
        } else {
          mergedShape[keyStr] = existing;
        }
      }
      return z.object({ shape: mergedShape } as any);
    }

    return z.any();
  }

  public merge(
    schemas: z.ZodTypeAny[]
  ): z.ZodTypeAny {
    if (!schemas || schemas.length === 0) {
      return z.any();
    }

    let mergedSchema: z.ZodTypeAny = z.object({});

    for (let i = 1; i < schemas.length; i++) {
      const currentSchema = schemas[i];
      const nextSchema = schemas[i - 1];

      if (i === 1) {
        mergedSchema = this.mergeSchemas(nextSchema, currentSchema);
      } else {
        mergedSchema = this.mergeSchemas(mergedSchema, currentSchema);
      }
    }

    return mergedSchema;
  }
}