import { z } from "zod";

type ConflictResolutionStrategy = "PREFER_LATEST" | "PREFER_EARLIEST" | "MERGE_ARRAY" | "FAIL";

interface SchemaMergerOptions {
  conflictStrategy: ConflictResolutionStrategy;
}

interface FieldReport {
  path: string;
  conflict: boolean;
  resolution: string;
}

interface MergeReport {
  fieldReports: FieldReport[];
  warnings: string[];
  errors: string[];
}

type Schema = z.ZodTypeAny;

class StructuredToolOutputSchemaMerger {
  private options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  private resolveConflict(
    path: string,
    existingSchema: Schema,
    newSchema: Schema,
    report: { fieldReports: FieldReport[]; warnings: string[]; errors: string[] }
  ): Schema {
    const strategy = this.options.conflictStrategy;

    if (strategy === "FAIL") {
      report.errors.push(`Conflict detected at ${path}: Cannot merge ${existingSchema.constructor.name} and ${newSchema.constructor.name}. Failing merge.`);
      // In a real scenario, we might throw or return a specific error schema.
      // For this implementation, we'll prioritize the existing one and warn.
      report.warnings.push(`Conflict at ${path} resolved by preferring existing schema due to FAIL strategy.`);
      return existingSchema;
    }

    if (strategy === "PREFER_LATEST") {
      report.fieldReports.push({ path, conflict: true, resolution: "Preferred latest schema." });
      return newSchema;
    }

    if (strategy === "PREFER_EARLIEST") {
      report.fieldReports.push({ path, conflict: true, resolution: "Preferred earliest schema." });
      return existingSchema;
    }

    if (strategy === "MERGE_ARRAY") {
      // This is a simplification. True array merging requires knowing the array element type.
      // We assume if both are arrays, we try to merge their contents recursively.
      if (existingSchema instanceof z.ZodArray && newSchema instanceof z.ZodArray) {
        const mergedItemSchema = this.resolveConflict(
          `${path} item`,
          existingSchema.element.constructor.name,
          newSchema.element.constructor.name,
          report
        );
        report.fieldReports.push({ path, conflict: true, resolution: "Merged array elements." });
        return z.array(mergedItemSchema);
      } else {
        report.warnings.push(`Array merge strategy applied at ${path}, but schemas are not both ZodArrays. Defaulting to latest.`);
        return newSchema;
      }
    }

    return newSchema; // Fallback
  }

  private mergeSchemas(
    existingSchema: Schema,
    newSchema: Schema,
    path: string,
    report: { fieldReports: FieldReport[]; warnings: string[]; errors: string[] }
  ): Schema {
    if (existingSchema.constructor.name !== newSchema.constructor.name) {
      report.warnings.push(`Type mismatch at ${path}: Existing (${existingSchema.constructor.name}) vs New (${newSchema.constructor.name}). Preferring latest.`);
      return newSchema;
    }

    if (existingSchema instanceof z.ZodObject && newSchema instanceof z.ZodObject) {
      const mergedObject = { ...existingSchema.shape, ...newSchema.shape };
      const finalShape: Record<string, z.ZodTypeAny> = {};

      const allKeys = new Set([...Object.keys(existingSchema.shape), ...Object.keys(newSchema.shape)]);

      for (const key of allKeys) {
        const existingField = existingSchema.shape[key];
        const newField = newSchema.shape[key];
        const currentPath = `${path}.${key}`;

        if (existingField && newField) {
          const mergedField = this.mergeSchemas(
            existingField,
            newField,
            currentPath,
            report
          );
          finalShape[key] = mergedField;
        } else if (existingField) {
          finalShape[key] = existingField;
        } else if (newField) {
          finalShape[key] = newField;
        }
      }

      return z.object(finalShape);
    }

    // Handle primitive type conflicts (e.g., string vs number)
    if (existingSchema.constructor.name !== newSchema.constructor.name) {
      return this.resolveConflict(path, existingSchema, newSchema, report);
    }

    // If they are the same type and not objects, prefer the new one (simplification)
    return newSchema;
  }

  public merge(schemas: Schema[], options: SchemaMergerOptions): { mergedSchema: Schema, report: MergeReport } {
    if (!schemas || schemas.length === 0) {
      throw new Error("Input schemas array cannot be empty.");
    }

    const initialReport: MergeReport = {
      fieldReports: [],
      warnings: [],
      errors: [],
    };

    let mergedSchema: Schema = schemas[0];

    for (let i = 1; i < schemas.length; i++) {
      const currentSchema = schemas[i];
      mergedSchema = this.mergeSchemas(
        mergedSchema,
        currentSchema,
        `root`,
        initialReport
      );
    }

    return {
      mergedSchema: mergedSchema,
      report: initialReport,
    };
  }
}

export { StructuredToolOutputSchemaMerger, ConflictResolutionStrategy };