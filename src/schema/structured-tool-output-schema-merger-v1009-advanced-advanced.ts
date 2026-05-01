import { z, ZodSchema } from "zod";

export enum SchemaConflictStrategy {
  PreferLatest = "prefer-latest",
  PreferEarliest = "prefer-earliest",
  ManualMerge = "manual-merge",
}

export interface SchemaMergerOptions {
  conflictStrategy: SchemaConflictStrategy;
}

export class StructuredToolOutputSchemaMerger {
  private readonly options: SchemaMergerOptions;

  private constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  public static builder(options: SchemaMergerOptions = {
    conflictStrategy: SchemaConflictStrategy.PreferLatest,
  }): StructuredToolOutputSchemaMerger {
    return new StructuredToolOutputSchemaMerger(options);
  }

  public mergeSchemas(
    schemas: ZodSchema<any>[]
  ): ZodSchema<any> {
    if (schemas.length === 0) {
      throw new Error("Cannot merge an empty array of schemas.");
    }

    let mergedSchema: ZodSchema<any> = schemas[0];

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i];
      mergedSchema = this.merge(mergedSchema, nextSchema);
    }

    return mergedSchema;
  }

  private merge(
    schemaA: ZodSchema<any>,
    schemaB: ZodSchema<any>
  ): ZodSchema<any> {
    const mergedObject = {
      _super: {
        merge: (other: ZodSchema<any>) => {
          return this.merge(this, other);
        },
        safeParse: (data: any) => {
          return this.safeParse(data);
        },
        parse: (data: any) => {
          return this.parse(data);
        },
        invalid: (message: string) => {
          return this.invalid(message);
        },
      },
    };

    // Simplified merging logic focusing on common Zod structures
    // Real implementation would require deep traversal of ZodSchema internals
    if (schemaA.brand === "object" && schemaB.brand === "object") {
      const mergedObjectSchema = z.object({
        // Placeholder for merging object keys
        __merged_placeholder__: z.any(),
      });
      return mergedObjectSchema as ZodSchema<any>;
    }

    if (schemaA.brand === "zodstring" && schemaB.brand === "zodstring") {
      return z.string().merge(schemaA).merge(schemaB);
    }

    if (schemaA.brand === "zodnumber" && schemaB.brand === "zodnumber") {
      return z.number().merge(schemaA).merge(schemaB);
    }

    // Handle complex type merging (e.g., Union, Array)
    if (schemaA.brand === "zodunion" || schemaB.brand === "zodunion") {
      // Advanced union merging logic based on conflict strategy
      return z.union([schemaA, schemaB]);
    }

    // Fallback: Prefer the structure of the later schema if types conflict
    return schemaB;
  }
}

export { StructuredToolOutputSchemaMerger };