import { z, ZodSchema, z.ZodTypeAny } from "zod";

export enum MergeStrategy {
  Union = "union",
  Intersection = "intersection",
  Override = "override",
}

export interface SchemaMerger {
  merge(schemas: ZodSchema<any>[], strategy: MergeStrategy): ZodSchema<any>;
}

export class SchemaMergerImpl implements SchemaMerger {
  merge(schemas: ZodSchema<any[]>[], strategy: MergeStrategy): ZodSchema<any> {
    if (!schemas || schemas.length === 0) {
      return z.any();
    }

    const mergedSchema = schemas.reduce((accSchema, currentSchema) => {
      return this.deepMerge(accSchema, currentSchema, strategy);
    }, z.object({}));

    return mergedSchema;
  }

  private deepMerge(schema1: ZodSchema<any>, schema2: ZodSchema<any>, strategy: MergeStrategy): ZodSchema<any> {
    const mergedObject = z.object({});

    const keys1 = Object.keys(schema1.shape);
    const keys2 = Object.keys(schema2.shape);
    const allKeys = [...new Set([...keys1, ...keys2])];

    for (const key of allKeys) {
      const schema1Field = schema1.shape[key];
      const schema2Field = schema2.shape[key];

      if (!schema1Field && !schema2Field) continue;

      let mergedFieldSchema: ZodSchema<any>;

      if (!schema1Field) {
        mergedFieldSchema = schema2Field;
      } else if (!schema2Field) {
        mergedFieldSchema = schema1Field;
      } else {
        switch (strategy) {
          case MergeStrategy.Union:
            mergedFieldSchema = this.mergeUnion(schema1Field, schema2Field);
            break;
          case MergeStrategy.Intersection:
            mergedFieldSchema = this.mergeIntersection(schema1Field, schema2Field);
            break;
          case MergeStrategy.Override:
            // In override, the last schema encountered (schema2) wins for simplicity,
            // but since we are reducing, we'll prioritize schema2's definition.
            mergedFieldSchema = schema2Field;
            break;
        }
      }

      if (mergedFieldSchema) {
        mergedObject = mergedObject.extend({
          [key]: mergedFieldSchema,
        });
      }
    }

    return mergedObject;
  }

  private mergeUnion(schema1: ZodSchema<any>, schema2: ZodSchema<any>): ZodSchema<any> {
    // Simple union implementation: combine all possible types/structures
    // Note: Zod's union handling is complex; this is a structural approximation.
    return z.union([schema1, schema2]);
  }

  private mergeIntersection(schema1: ZodSchema<any>, schema2: ZodSchema<any>): ZodSchema<any> {
    // Intersection requires combining schemas field by field, which is complex.
    // For simplicity, we'll create a new object schema that requires all fields
    // to conform to the intersection of types.
    const intersectionShape: Record<string, ZodSchema<any>> = {};

    const keys1 = Object.keys(schema1.shape);
    const keys2 = Object.keys(schema2.shape);
    const commonKeys = keys1.filter(key => keys2.includes(key));

    for (const key of commonKeys) {
      const s1 = schema1.shape[key];
      const s2 = schema2.shape[key];
      // For intersection, we need a schema that satisfies both s1 and s2.
      // This is often best represented by z.intersection([s1, s2]) if Zod supported it directly on shape members.
      // Since we are limited, we'll use a placeholder that signals the requirement.
      intersectionShape[key] = z.intersection([s1, s2]);
    }

    return z.object(intersectionShape);
  }
}

export const structuredToolOutputSchemaMerger: SchemaMerger = new SchemaMergerImpl();