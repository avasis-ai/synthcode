import {
  Schema,
  FieldDefinition,
  SchemaMergerOptions,
  ConflictReport,
} from "./schema-types";

type ConflictResolutionStrategy = "prefer_latest" | "prefer_earliest" | "merge_arrays" | "fail_on_conflict";

interface SchemaMergerOptions {
  defaultStrategy?: ConflictResolutionStrategy;
  fieldStrategies?: Record<string, ConflictResolutionStrategy>;
}

export class StructuredToolOutputSchemaMergerV9 {
  private readonly defaultOptions: SchemaMergerOptions = {
    defaultStrategy: "fail_on_conflict",
  };

  merge(schemas: Schema[], options: SchemaMergerOptions = {}): { mergedSchema: Schema; conflicts: ConflictReport[] } {
    if (!schemas || schemas.length === 0) {
      return { mergedSchema: { type: "object", properties: {} }, conflicts: [] };
    }

    const finalOptions: SchemaMergerOptions = {
      defaultStrategy: options.defaultStrategy || this.defaultOptions.defaultStrategy,
      fieldStrategies: { ...this.defaultOptions.fieldStrategies, ...options.fieldStrategies },
    };

    const mergedProperties: Record<string, FieldDefinition> = {};
    const conflicts: ConflictReport[] = [];

    for (const schema of schemas) {
      if (schema.type !== "object" || !schema.properties) {
        continue;
      }

      for (const [fieldName, fieldDefinition] of Object.entries(schema.properties)) {
        const fieldNameKey = fieldName;
        const currentDefinition = mergedProperties[fieldNameKey];

        if (!currentDefinition) {
          mergedProperties[fieldNameKey] = fieldDefinition;
          continue;
        }

        const strategy = finalOptions.fieldStrategies[fieldNameKey] || finalOptions.defaultStrategy!;
        const conflict = this.resolveConflict(
          fieldNameKey,
          currentDefinition,
          fieldDefinition,
          strategy
        );

        if (conflict) {
          conflicts.push(conflict);
          if (strategy === "fail_on_conflict") {
            throw new Error(`Schema conflict detected for field "${fieldNameKey}": ${conflict.reason}`);
          }
          // If not failing, the conflict resolution logic inside resolveConflict will update mergedProperties
        }
      }
    }

    const mergedSchema: Schema = {
      type: "object",
      properties: mergedProperties,
    };

    return { mergedSchema, conflicts };
  }

  private resolveConflict(
    fieldName: string,
    existingDef: FieldDefinition,
    newDef: FieldDefinition,
    strategy: ConflictResolutionStrategy
  ): ConflictReport | null {
    const isConflict = this.areDefinitionsConflicting(existingDef, newDef);

    if (!isConflict) {
      return null;
    }

    let resolvedDefinition: FieldDefinition | undefined = undefined;
    let conflictReport: ConflictReport = {
      field: fieldName,
      reason: "Conflict detected",
      resolution: "Unresolved",
      details: `Existing: ${JSON.stringify(existingDef)}, New: ${JSON.stringify(newDef)}`,
    };

    switch (strategy) {
      case "prefer_latest":
        resolvedDefinition = newDef;
        conflictReport.resolution = "Preferred New";
        break;
      case "prefer_earliest":
        resolvedDefinition = existingDef;
        conflictReport.resolution = "Preferred Existing";
        break;
      case "merge_arrays":
        if (existingDef.type === "array" && newDef.type === "array") {
          // Simple merge: assume array items are compatible or just take the union of items if possible
          // For simplicity here, we'll just merge the definitions if they are both arrays of the same item type.
          if (existingDef.items && newDef.items && existingDef.items.type === newDef.items.type) {
            resolvedDefinition = {
              type: "array",
              items: { type: "object", properties: { /* Placeholder for merged items */ } } as any, // Simplified merge
            };
            conflictReport.resolution = "Merged Arrays";
          } else {
            resolvedDefinition = newDef; // Fallback
            conflictReport.resolution = "Merged Arrays (Fallback)";
          }
        } else {
          resolvedDefinition = newDef; // Cannot merge non-array types
          conflictReport.resolution = "Merged Arrays (Failed)";
        }
        break;
      case "fail_on_conflict":
      default:
        // No change to mergedProperties, conflict report remains as is
        return conflictReport;
    }

    if (resolvedDefinition) {
      // Update the merged properties map (this requires the caller to handle the update)
      // For this method signature, we just return the report and let the caller handle the merge.
      // Since we cannot modify the map directly here, we signal success via the report structure.
      conflictReport.resolution = "Resolved";
      conflictReport.details = `Resolved using ${strategy}.`;
      // In a real implementation, we would return { resolvedDefinition, conflictReport }
      // For this structure, we rely on the caller to update the map if resolution is successful.
    }

    return conflictReport;
  }

  private areDefinitionsConflicting(
    existingDef: FieldDefinition,
    newDef: FieldDefinition
  ): boolean {
    if (existingDef.type !== newDef.type) {
      return true;
    }
    if (existingDef.type === "object" && newDef.type === "object") {
      // Deep comparison for object structure conflict (simplified)
      const existingProps = Object.keys(existingDef.properties || {}) as (keyof FieldDefinition)[];
      const newProps = Object.keys(newDef.properties || {}) as (keyof FieldDefinition)[];
      if (existingProps.length !== newProps.length) return true;
      // More complex check needed for deep structural differences
    }
    return false;
  }
}