import { z, ZodSchema } from "zod";

export type ConflictResolutionStrategy =
  | "prefer_union"
  | "prefer_intersection"
  | "fail_on_conflict";

export interface SchemaMergerOptions {
  strategy: ConflictResolutionStrategy;
}

export interface FieldMergeReport {
  fieldName: string;
  resolution: "merged" | "overwritten" | "retained" | "conflict_flagged";
  details: string;
}

export interface MergeReport {
  success: boolean;
  errors: string[];
  fieldReports: FieldMergeReport[];
}

export class StructuredToolOutputSchemaMerger {
  private readonly options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private resolveType(
    schema1: ZodSchema,
    schema2: ZodSchema
  ): ZodSchema {
    const strategy = this.options.strategy;

    if (strategy === "prefer_union") {
      return z.union([schema1, schema2]);
    }

    if (strategy === "prefer_intersection") {
      return z.intersection([schema1, schema2]);
    }

    // Default or fail_on_conflict handling for types (though Zod handles most)
    // For simplicity in this context, we'll rely on Zod's union/intersection for merging
    // complex types, and treat direct type mismatches as conflicts if not explicitly handled.
    return z.any(); // Placeholder for complex logic
  }

  private mergeObjectSchema(
    schemas: ZodSchema[]
  ): ZodSchema {
    if (schemas.length === 0) {
      return z.object({});
    }

    const allFields: Set<string> = new Set<string>();
    for (const schema of schemas) {
      if (schema instanceof z.ZodObject) {
        Object.keys(schema.shape).forEach((key) => {
          allFields.add(key);
        });
      }
    }

    const mergedShape: Record<string, ZodSchema> = {};
    const fieldReports: FieldMergeReport[] = [];

    for (const fieldName of allFields) {
      const fieldSchemas: ZodSchema[] = [];
      for (const schema of schemas) {
        if (schema instanceof z.ZodObject && schema.shape[fieldName]) {
          fieldSchemas.push(schema.shape[fieldName]);
        }
      }

      if (fieldSchemas.length === 0) continue;

      let mergedSchema: ZodSchema;
      let resolution: "merged" | "overwritten" | "retained" | "conflict_flagged" = "retained";
      let details = "";

      if (fieldSchemas.length === 1) {
        mergedSchema = fieldSchemas[0];
        resolution = "retained";
        details = "Only one source defined this field.";
      } else {
        // Merge logic for multiple sources
        if (this.options.strategy === "prefer_union") {
          mergedSchema = z.union([
            ...fieldSchemas.slice(0, fieldSchemas.length - 1),
            fieldSchemas[fieldSchemas.length - 1]
          ]);
          resolution = "merged";
          details = "Union type created from multiple sources.";
        } else if (this.options.strategy === "prefer_intersection") {
          mergedSchema = z.intersection(fieldSchemas);
          resolution = "merged";
          details = "Intersection type created from multiple sources.";
        } else {
          // Fail on conflict or default to union if intersection is too restrictive
          mergedSchema = z.union([
            ...fieldSchemas.slice(0, fieldSchemas.length - 1),
            fieldSchemas[fieldSchemas.length - 1]
          ]);
          resolution = "conflict_flagged";
          details = "Conflict detected; using union as fallback.";
        }
      }

      mergedShape[fieldName] = mergedSchema;
      fieldReports.push({
        fieldName,
        resolution,
        details,
      });
    }

    const finalSchema = z.object(mergedShape);
    return { schema: finalSchema, reports: fieldReports };
  }

  public merge(
    schemas: ZodSchema[]
  ): { mergedSchema: ZodSchema; report: MergeReport } {
    if (!schemas || schemas.length === 0) {
      return {
        mergedSchema: z.object({}),
        report: {
          success: true,
          errors: [],
          fieldReports: [],
        },
      };
    }

    const { schema: mergedSchema, reports: fieldReports } = this.mergeObjectSchema(schemas);

    const report: MergeReport = {
      success: true,
      errors: [],
      fieldReports: fieldReports,
    };

    return { mergedSchema, report };
  }
}