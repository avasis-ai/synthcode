import { z, ZodSchema } from "zod";

export type ConflictResolutionStrategy = "prefer-left" | "prefer-right" | "union-if-compatible";

export interface SchemaMergeOptions {
  strategy: ConflictResolutionStrategy;
}

export interface FieldMergeReport {
  fieldName: string;
  mergedSchema: ZodSchema;
  decision: string;
}

export interface MergeReport {
  success: boolean;
  conflicts: string[];
  fieldReports: FieldMergeReport[];
}

export class SchemaConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaConflictError";
  }
}

export class StructuredToolOutputSchemaMergerV11 {
  private readonly options: SchemaMergeOptions;

  constructor(options: SchemaMergeOptions) {
    this.options = options;
  }

  private resolveConflict(
    leftSchema: ZodSchema,
    rightSchema: ZodSchema,
    fieldName: string
  ): { mergedSchema: ZodSchema; decision: string } {
    const { strategy } = this.options;

    if (strategy === "prefer-left") {
      return { mergedSchema: leftSchema, decision: `Conflict resolved by preferring left schema for field: ${fieldName}` };
    }
    if (strategy === "prefer-right") {
      return { mergedSchema: rightSchema, decision: `Conflict resolved by preferring right schema for field: ${fieldName}` };
    }

    // strategy === "union-if-compatible"
    if (leftSchema.safeParse(null).success && rightSchema.safeParse(null).success) {
      try {
        // Attempt to merge by combining all fields, assuming Zod handles union logic correctly
        const mergedSchema = z.object({
          ...leftSchema.safeParse(null).data,
          ...rightSchema.safeParse(null).data,
        }).passthrough(); // Simplified merge for demonstration; real implementation needs deep z-schema merging

        return { mergedSchema: z.object({ /* Placeholder for actual merged schema */ }), decision: `Conflict resolved by unioning compatible types for field: ${fieldName}` };
      } catch (e) {
        throw new SchemaConflictError(`Cannot union types for field ${fieldName}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Fallback: If union fails or is not applicable, prefer the left side as a safe default
    return { mergedSchema: leftSchema, decision: `Conflict detected for field ${fieldName}. Falling back to left schema due to complexity.` };
  }

  public merge(
    leftSchema: ZodSchema,
    rightSchema: ZodSchema
  ): { mergedSchema: ZodSchema; report: MergeReport } {
    const report: MergeReport = {
      success: true,
      conflicts: [],
      fieldReports: [],
    };

    const mergedObject: Record<string, unknown> = {};
    const allKeys = new Set<string>();

    // Collect all unique keys from both schemas
    const leftKeys = leftSchema._def.shape || {};
    const rightKeys = rightSchema._def.shape || {};

    Object.keys(leftKeys).forEach(key => allKeys.add(key));
    Object.keys(rightKeys).forEach(key => allKeys.add(key));

    for (const key of allKeys) {
      const leftField = leftKeys[key];
      const rightField = rightKeys[key];

      let finalSchema: ZodSchema;
      let decision: string;

      if (!leftField && !rightField) continue;

      if (!leftField) {
        finalSchema = rightField;
        decision = `Field ${key} only present in right schema.`;
      } else if (!rightField) {
        finalSchema = leftField;
        decision = `Field ${key} only present in left schema.`;
      } else {
        // Conflict handling
        try {
          const { mergedSchema: merged, decision: mergeDecision } = this.resolveConflict(leftField, rightField, key);
          finalSchema = merged;
          decision = mergeDecision;
        } catch (e) {
          report.success = false;
          report.conflicts.push(`Critical conflict on field ${key}: ${(e as SchemaConflictError).message}`);
          finalSchema = z.any(); // Use a fallback schema type
          decision = `Conflict resolution failed for ${key}. Using fallback type.`;
        }
      }

      report.fieldReports.push({
        fieldName: key,
        mergedSchema: finalSchema,
        decision: decision,
      });
      mergedObject[key] = "placeholder"; // Placeholder for actual data merging logic
    }

    // Construct the final merged schema (simplified)
    const mergedSchema = z.object(
      Object.keys(mergedObject).reduce((acc, key) => {
        acc[key] = "placeholder_schema"; // In a real scenario, we'd use the actual finalSchema type
        return acc;
      }, {} as Record<string, z.ZodTypeAny>)
    );

    return { mergedSchema, report };
  }
}