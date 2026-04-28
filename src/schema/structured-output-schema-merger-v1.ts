import { z, ZodSchema } from "zod";

type ConflictResolutionStrategy = "prefer_latest" | "union_all";

interface SchemaDefinition {
  type: "object";
  properties: Record<string, z.ZodTypeAny>;
  required: string[];
}

interface MergeReport {
  conflicts: Record<string, { field: string; message: string }>;
  warnings: Record<string, string>;
}

export class SchemaMerger {
  private schemas: z.ZodSchema<any>[];
  private strategy: ConflictResolutionStrategy;

  constructor(schemas: z.ZodSchema<any>[], strategy: ConflictResolutionStrategy) {
    if (!schemas || schemas.length === 0) {
      throw new Error("SchemaMerger requires at least one schema.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private resolveTypeConflict(
    field: string,
    types: z.ZodTypeAny[]
  ): z.ZodTypeAny {
    if (types.length === 1) {
      return types[0];
    }

    if (this.strategy === "union_all") {
      return z.discriminatedUnion("any", [
        ...types.map(type => type.brand ? type.brand.constructor : type)
      ] as any);
    }

    // Prefer latest strategy: If types conflict, we must pick one or fail.
    // For simplicity in this implementation, we'll union them if they are complex,
    // otherwise, we'll default to the last one encountered if they are primitives.
    const lastType = types[types.length - 1];
    if (lastType.brand) {
      return lastType;
    }
    return lastType;
  }

  private mergeProperties(
    field: string,
    propertySchemas: z.ZodTypeAny[]
  ): {
    schema: z.ZodTypeAny;
    report: Record<string, { field: string; message: string }>;
  } {
    const report: Record<string, { field: string; message: string }> = {};
    const mergedSchema = this.resolveTypeConflict(field, propertySchemas);

    if (this.strategy === "prefer_latest" && propertySchemas.length > 1) {
      // Check for non-resolvable conflicts (e.g., string vs number)
      const firstSchema = propertySchemas[0];
      const lastSchema = propertySchemas[propertySchemas.length - 1];

      if (firstSchema.zodType === "string" && lastSchema.zodType === "number") {
        report[field] = {
          field: field,
          message: "Type conflict detected: 'string' in early schemas, 'number' in later schemas. Manual review required.",
        };
      }
    }

    return { schema: mergedSchema, report };
  }

  public merge(): {
    schema: z.ZodSchema<any>;
    report: MergeReport;
  } {
    const finalProperties: Record<string, z.ZodTypeAny> = {};
    const report: MergeReport = {
      conflicts: {},
      warnings: {},
    };

    for (const schema of this.schemas) {
      if (!schema.shape) continue;

      for (const [key, propertySchema] of Object.entries(schema.shape)) {
        const field = key;
        const currentPropertySchemas: z.ZodTypeAny[] = [];

        // Collect all schemas for this field across all input schemas
        for (const s of this.schemas) {
          if (s.shape && s.shape[field]) {
            currentPropertySchemas.push(s.shape[field]);
          }
        }

        if (currentPropertySchemas.length === 0) continue;

        const { schema: mergedSchema, report: fieldReport } = this.mergeProperties(
          field,
          currentPropertySchemas
        );

        finalProperties[field] = mergedSchema;

        // Aggregate reports
        Object.assign(report.conflicts, fieldReport);
        if (fieldReport[field] && fieldReport[field].message.includes("Manual review")) {
          report.warnings[field] = "Potential type conflict requiring manual review.";
        }
      }
    }

    const unifiedSchema = z.object({
      // Placeholder for actual object structure based on merged properties
      ...(Object.keys(finalProperties).reduce((acc, key) => {
        acc[key] = finalProperties[key];
        return acc;
      }, {} as Record<string, z.ZodTypeAny>)),
    });

    return {
      schema: unifiedSchema as z.ZodSchema<any>,
      report: report,
    };
  }
}