import {
  SchemaField,
  SchemaDefinition,
  MergeReport,
  ConflictResolutionStrategy,
} from "./schema-types";

export class StructuredToolOutputSchemaMergerAdvanced {
  private readonly conflictStrategy: ConflictResolutionStrategy;

  constructor(conflictStrategy: ConflictResolutionStrategy = ConflictResolutionStrategy.PreferLatest) {
    this.conflictStrategy = conflictStrategy;
  }

  public mergeWithConflictResolution(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
  ): {
    mergedSchema: SchemaDefinition;
    report: MergeReport;
  } {
    const report: MergeReport = {
      conflicts: [],
      resolutions: [],
      warnings: [],
    };

    const mergedSchema: SchemaDefinition = {
      type: "object",
      properties: { ...schemaA.properties, ...schemaB.properties },
      required: [...schemaA.required, ...schemaB.required],
    };

    const allKeys = new Set<string>([
      ...Object.keys(schemaA.properties),
      ...Object.keys(schemaB.properties),
    ]);

    for (const key of allKeys) {
      const propA = schemaA.properties[key];
      const propB = schemaB.properties[key];

      if (!propA && !propB) continue;

      if (!propA) {
        mergedSchema.properties[key] = propB;
        report.resolutions.push({
          key,
          resolution: "Added from Schema B",
          details: `Field ${key} only exists in Schema B.`,
        });
        continue;
      }

      if (!propB) {
        mergedSchema.properties[key] = propA;
        report.resolutions.push({
          key,
          resolution: "Kept from Schema A",
          details: `Field ${key} only exists in Schema A.`,
        });
        continue;
      }

      if (this.areFieldsCompatible(propA, propB)) {
        mergedSchema.properties[key] = this.deepMergeSchema(propA, propB);
        report.resolutions.push({
          key,
          resolution: "Deep Merged",
          details: `Fields ${key} merged successfully.`,
        });
      } else {
        const conflictReport = this.resolveConflict(
          key, propA, propB, report.conflicts
        );
        if (conflictReport) {
          mergedSchema.properties[key] = conflictReport.mergedSchema;
          report.resolutions.push({
            key,
            resolution: conflictReport.resolution,
            details: `Conflict resolved for ${key}: ${conflictReport.details}`,
          });
        } else {
          report.warnings.push({
            key,
            message: `Unresolvable conflict for field ${key}. Check manual resolution.`,
          });
          // Fallback: Keep A if conflict resolution fails entirely
          mergedSchema.properties[key] = propA;
        }
      }
    }

    // Final required field consolidation (simple union for now, complex logic omitted for brevity)
    const finalRequired = new Set<string>();
    [...schemaA.required, ...schemaB.required].forEach(r => finalRequired.add(r));
    mergedSchema.required = Array.from(finalRequired);

    return {
      mergedSchema,
      report,
    };
  }

  private areFieldsCompatible(propA: SchemaField, propB: SchemaField): boolean {
    if (propA.type !== propB.type) {
      return false;
    }
    if (propA.type === "object" && propB.type === "object") {
      return true;
    }
    return true;
  }

  private deepMergeSchema(propA: SchemaField, propB: SchemaField): SchemaField {
    if (propA.type !== "object" || propB.type !== "object") {
      return propA; // Should be caught by compatibility check, but safe fallback
    }

    const mergedProps: Record<string, SchemaField> = { ...propA.properties, ...propB.properties };
    const mergedRequired = new Set<string>();

    [...propA.required, ...propB.required].forEach(r => mergedRequired.add(r));

    const mergedSchema: SchemaField = {
      type: "object",
      properties: mergedProps,
      required: Array.from(mergedRequired),
    };
    return mergedSchema;
  }

  private resolveConflict(
    key: string,
    propA: SchemaField,
    propB: SchemaField,
    conflicts: ConflictReport[]
  ): {
    mergedSchema: SchemaField;
    resolution: string;
    details: string;
  } | null {
    const conflict: ConflictReport = {
      key,
      schemaA: propA,
      schemaB: propB,
      conflictType: this.determineConflictType(propA, propB),
    };
    conflicts.push(conflict);

    let mergedSchema: SchemaField;
    let resolution: string;
    let details: string;

    switch (this.conflictStrategy) {
      case ConflictResolutionStrategy.PreferLatest:
        mergedSchema = propB;
        resolution = "Prefer Latest (Schema B)";
        details = `Conflict resolved by preferring Schema B's definition for ${key}.`;
        break;
      case ConflictResolutionStrategy.PreferDeepest:
        // Simplification: Assume B is "deeper" if it has more properties defined
        if (propB.properties && Object.keys(propB.properties).length > Object.keys(propA.properties).length) {
          mergedSchema = propB;
          resolution = "Prefer Deepest (Schema B)";
          details = `Conflict resolved by preferring Schema B's definition for ${key} due to greater depth/breadth.`;
        } else {
          mergedSchema = propA;
          resolution = "Prefer Deepest (Schema A)";
          details = `Conflict resolved by preferring Schema A's definition for ${key}.`;
        }
        break;
      case ConflictResolutionStrategy.RequireManual:
        return null; // Signal that manual intervention is required
      default:
        return null;
    }

    return {
      mergedSchema,
      resolution,
      details,
    };
  }

  private determineConflictType(propA: SchemaField, propB: SchemaField): "TypeMismatch" | "RequiredMismatch" | "StructuralConflict" {
    if (propA.type !== propB.type) {
      return "TypeMismatch";
    }
    // Basic check for required mismatch (if one requires it and the other doesn't, or vice versa)
    const requiredA = propA.required && propA.required.length > 0;
    const requiredB = propB.required && propB.required.length > 0;
    if (requiredA !== requiredB) {
        return "RequiredMismatch";
    }
    return "StructuralConflict";
  }
}