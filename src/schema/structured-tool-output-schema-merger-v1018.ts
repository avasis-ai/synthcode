import { z, ZodSchema } from "zod";

export enum ConflictResolutionStrategy {
  PreferLatest = "prefer_latest",
  PreferMostSpecific = "prefer_most_specific",
  ErrorOnConflict = "error_on_conflict",
}

export interface MergeReport {
  conflicts: string[];
  resolutions: string[];
  warnings: string[];
}

export class StructuredToolOutputSchemaMerger {
  private report: MergeReport;

  constructor() {
    this.report = {
      conflicts: [],
      resolutions: [],
      warnings: [],
    };
  }

  public getReport(): MergeReport {
    return this.report;
  }

  public mergeSchemas(
    schemas: ZodSchema<any>[],
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.PreferMostSpecific
  ): ZodSchema<any> {
    if (schemas.length === 0) {
      throw new Error("Cannot merge an empty array of schemas.");
    }

    let mergedSchema = schemas[0];

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i];
      mergedSchema = this.mergeSchemasInternal(mergedSchema, nextSchema, strategy, i);
    }

    return mergedSchema;
  }

  private mergeSchemasInternal(
    schema1: ZodSchema<any>,
    schema2: ZodSchema<any>,
    strategy: ConflictResolutionStrategy,
    sourceIndex: number
  ): ZodSchema<any> {
    const merged = this.mergeSchemasRecursive(schema1, schema2, strategy, `Schema ${sourceIndex}`);
    return merged;
  }

  private mergeSchemasRecursive(
    schema1: ZodSchema<any>,
    schema2: ZodSchema<any>,
    strategy: ConflictResolutionStrategy,
    sourceName: string
  ): ZodSchema<any> {
    if (!schema1 || !schema2) {
      return schema1 || schema2;
    }

    const mergedSchema = z.object({});

    const keys1 = Object.keys(schema1.shape || {});
    const keys2 = Object.keys(schema2.shape || {});
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const s1 = schema1.shape?.[key];
      const s2 = schema2.shape?.[key];

      if (!s1 && !s2) continue;

      let finalSchema: ZodSchema<any> | undefined;

      if (s1 && s2) {
        finalSchema = this.mergeObjectSchemas(s1, s2, strategy, key, sourceName);
      } else if (s1) {
        finalSchema = s1;
      } else {
        finalSchema = s2;
      }

      if (finalSchema) {
        mergedSchema = mergedSchema.extend({ [key]: finalSchema });
      }
    }

    return mergedSchema;
  }

  private mergeObjectSchemas(
    schema1: ZodSchema<any>,
    schema2: ZodSchema<any>,
    strategy: ConflictResolutionStrategy,
    key: string,
    sourceName: string
  ): ZodSchema<any> {
    const merged = z.object({});

    const keys1 = Object.keys(schema1.shape || {});
    const keys2 = Object.keys(schema2.shape || {});
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const s1 = schema1.shape?.[key];
      const s2 = schema2.shape?.[key];

      let finalSchema: ZodSchema<any> | undefined;

      if (s1 && s2) {
        finalSchema = this.mergeObjectSchemas(s1, s2, strategy, key, sourceName);
      } else if (s1) {
        finalSchema = s1;
      } else {
        finalSchema = s2;
      }

      if (finalSchema) {
        merged.extend({ [key]: finalSchema });
      }
    }
    return merged;
  }

  private mergeSchemasRecursive(
    schema1: ZodSchema<any>,
    schema2: ZodSchema<any>,
    strategy: ConflictResolutionStrategy,
    sourceName: string
  ): ZodSchema<any> {
    const merged = z.object({});

    const keys1 = Object.keys(schema1.shape || {});
    const keys2 = Object.keys(schema2.shape || {});
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const s1 = schema1.shape?.[key];
      const s2 = schema2.shape?.[key];

      if (!s1 && !s2) continue;

      let finalSchema: ZodSchema<any> | undefined;

      if (s1 && s2) {
        finalSchema = this.mergeSchemasRecursive(s1, s2, strategy, key);
      } else if (s1) {
        finalSchema = s1;
      } else {
        finalSchema = s2;
      }

      if (finalSchema) {
        merged.extend({ [key]: finalSchema });
      }
    }
    return merged;
  }

  private mergeArraySchemas(
    schema1: ZodSchema<any>,
    schema2: ZodSchema<any>,
    strategy: ConflictResolutionStrategy,
    key: string,
    sourceName: string
  ): ZodSchema<any> {
    if (schema1.brand !== 'z.ZodArray' || schema2.brand !== 'z.ZodArray') {
      return z.z.any();
    }

    const itemSchema1 = schema1.element;
    const itemSchema2 = schema2.element;

    if (!itemSchema1 || !itemSchema2) {
      return z.z.any();
    }

    const mergedItemSchema = this.mergeSchemasRecursive(
      itemSchema1,
      itemSchema2,
      strategy,
      key
    );

    return z.array(mergedItemSchema);
  }

  public mergeSchemasForToolOutput(
    schemas: ZodSchema<any>[],
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.PreferMostSpecific
  ): ZodSchema<any> {
    this.report = { conflicts: [], resolutions: [], warnings: [] };
    let mergedSchema = z.object({});

    for (let i = 0; i < schemas.length; i++) {
      const currentSchema = schemas[i];
      if (i === 0) {
        mergedSchema = currentSchema;
      } else {
        mergedSchema = this.mergeSchemasForToolOutputInternal(
          mergedSchema,
          currentSchema,
          strategy,
          i
        );
      }
    }
    return mergedSchema;
  }

  private mergeSchemasForToolOutputInternal(
    schema1: ZodSchema<any>,
    schema2: ZodSchema<any>,
    strategy: ConflictResolutionStrategy,
    sourceIndex: number
  ): ZodSchema<any> {
    const merged = z.object({});

    const keys1 = Object.keys(schema1.shape || {});
    const keys2 = Object.keys(schema2.shape || {});
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const s1 = schema1.shape?.[key];
      const s2 = schema2.shape?.[key];

      if (!s1 && !s2) continue;

      let finalSchema: ZodSchema<any> | undefined;

      if (s1 && s2) {
        finalSchema = this.mergeSchemasForToolOutputInternal(
          s1,
          s2,
          strategy,
          sourceIndex
        );
      } else if (s1) {
        finalSchema = s1;
      } else {
        finalSchema = s2;
      }

      if (finalSchema) {
        merged.extend({ [key]: finalSchema });
      }
    }
    return merged;
  }
}