import { z } from "zod";

export type ConflictResolutionStrategy = "LATEST" | "EARLIEST" | "MERGE_FIELDS";

export interface SchemaMergeResult {
  mergedSchema: z.ZodTypeAny;
  confidenceScore: number;
  conflictsResolved: {
    field: string;
    strategyUsed: ConflictResolutionStrategy;
    details: string;
  }[];
}

export class StructuredToolOutputSchemaMergerAdvanced {
  private schemas: z.ZodTypeAny[];
  private strategy: ConflictResolutionStrategy;

  constructor(schemas: z.ZodTypeAny[], strategy: ConflictResolutionStrategy = "MERGE_FIELDS") {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema list cannot be empty.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private calculateConfidenceScore(conflicts: { field: string; strategyUsed: ConflictResolutionStrategy; details: string }[]): number {
    const totalConflicts = conflicts.length;
    // Simple scoring: 100 base + 10 per conflict resolved
    return Math.min(100 + totalConflicts * 10, 1000);
  }

  private resolveFieldConflict(
    field: string,
    values: z.ZodTypeAny[],
    strategy: ConflictResolutionStrategy
  ): { mergedSchema: z.ZodTypeAny; conflict: { field: string; strategyUsed: ConflictResolutionStrategy; details: string } } {
    let mergedSchema: z.ZodTypeAny;
    let conflict: { field: string; strategyUsed: ConflictResolutionStrategy; details: string };

    switch (strategy) {
      case "LATEST":
        mergedSchema = values[values.length - 1];
        conflict = { field, strategyUsed: "LATEST", details: `Used schema from the last version.` };
        break;
      case "EARLIEST":
        mergedSchema = values[0];
        conflict = { field, strategyUsed: "EARLIEST", details: `Used schema from the first version.` };
        break;
      case "MERGE_FIELDS":
        // Advanced merge logic for primitives/objects
        const firstSchema = values[0];
        let combinedObject: Record<string, unknown> = {};
        let hasConflict = false;

        // Simple object merging simulation (assuming all schemas define objects)
        if (firstSchema.isObject) {
          const keys = Object.keys(firstSchema.shape);
          for (const key of keys) {
            const keySchemas = values.map(s => s.shape[key] || z.any());
            const mergedKeySchema = this.mergeSingleField(key, keySchemas);
            combinedObject[key] = mergedKeySchema;
          }
          mergedSchema = z.object(combinedObject);
          conflict = { field, strategyUsed: "MERGE_FIELDS", details: "Object fields merged recursively." };
        } else {
          // Fallback for non-object types
          mergedSchema = values[0];
          conflict = { field, strategyUsed: "MERGE_FIELDS", details: "Could not perform deep merge; using first schema." };
        }
        break;
    }
    return { mergedSchema, conflict };
  }

  private mergeSingleField(field: string, fieldSchemas: z.ZodTypeAny[]): z.ZodTypeAny {
    if (fieldSchemas.length === 0) return z.any();

    const firstSchema = fieldSchemas[0];
    const lastSchema = fieldSchemas[fieldSchemas.length - 1];

    if (firstSchema.constructor === lastSchema.constructor && firstSchema.safeParse({}): { success: boolean } && lastSchema.safeParse({}): { success: boolean }) {
        // If types are identical and simple, just use the last one
        return lastSchema;
    }

    // Handle complex type merging (e.g., unions, enums)
    if (firstSchema.isUnion && fieldSchemas.every(s => s.isUnion)) {
        // For unions, we take the union of all possible types
        const unionTypes: z.ZodTypeAny[] = fieldSchemas.map(s => s);
        return z.unionAll(unionTypes);
    }

    // Fallback to conflict resolution logic
    const { mergedSchema: resultSchema, conflict: _ } = this.resolveFieldConflict(field, fieldSchemas, "MERGE_FIELDS");
    return resultSchema;
  }

  public mergeSchemas(): SchemaMergeResult {
    let finalShape: Record<string, z.ZodTypeAny> = {};
    const resolvedConflicts: { field: string; strategyUsed: ConflictResolutionStrategy; details: string }[] = [];

    // 1. Collect all unique keys across all schemas
    const allKeys = new Set<string>();
    for (const schema of this.schemas) {
      if (schema.isObject) {
        Object.keys(schema.shape).forEach(key => allKeys.add(key));
      }
    }

    // 2. Merge each field independently
    for (const key of allKeys) {
      const fieldSchemas: z.ZodTypeAny[] = this.schemas
        .map(schema => schema.shape[key] || z.any());

      // Filter out z.any() placeholders if they are not meaningful
      const meaningfulFieldSchemas = fieldSchemas.filter(s => s !== z.any());

      if (meaningfulFieldSchemas.length === 0) continue;

      // Use the advanced merging logic for the field
      const { mergedSchema: fieldSchema, conflict: conflictDetail } = this.resolveFieldConflict(
        key,
        meaningfulFieldSchemas,
        this.strategy
      );

      finalShape[key] = fieldSchema;
      if (conflictDetail) {
        resolvedConflicts.push(conflictDetail);
      }
    }

    const mergedSchema = z.object(finalShape);
    const confidenceScore = this.calculateConfidenceScore(resolvedConflicts);

    return {
      mergedSchema,
      confidenceScore,
      conflictsResolved: resolvedConflicts,
    };
  }
}