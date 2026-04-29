import {
  SchemaDefinition,
  FieldDefinition,
  ConflictResolutionStrategy,
  SchemaMergeReport,
} from "./types";

class StructuredToolOutputSchemaMergerV1013 {
  private readonly conflictStrategy: ConflictResolutionStrategy;

  constructor(conflictStrategy: ConflictResolutionStrategy = "union") {
    this.conflictStrategy = conflictStrategy;
  }

  merge(schemas: SchemaDefinition[]): { mergedSchema: SchemaDefinition; report: SchemaMergeReport } {
    if (!schemas || schemas.length === 0) {
      return {
        mergedSchema: { type: "object", properties: {} } as SchemaDefinition,
        report: {
          conflicts: [],
          merges: [],
          overwrites: [],
          manualReviewRequired: false,
        },
      };
    }

    let currentSchema: SchemaDefinition = { type: "object", properties: {} } as SchemaDefinition;
    let report: SchemaMergeReport = {
      conflicts: [],
      merges: [],
      overwrites: [],
      manualReviewRequired: false,
    };

    for (let i = 0; i < schemas.length; i++) {
      const schema = schemas[i];
      const { merged: newSchema, report: partialReport } = this.mergeSchema(
        currentSchema,
        schema,
        i,
        schemas.length
      );

      currentSchema = newSchema;
      report.conflicts.push(...partialReport.conflicts);
      report.merges.push(...partialReport.merges);
      report.overwrites.push(...partialReport.overwrites);
      if (partialReport.manualReviewRequired) {
        report.manualReviewRequired = true;
      }
    }

    return { mergedSchema: currentSchema, report };
  }

  private mergeSchema(
    baseSchema: SchemaDefinition,
    newSchema: SchemaDefinition,
    sourceIndex: number,
    totalSources: number
  ): { merged: SchemaDefinition; report: SchemaMergeReport } {
    const mergedProperties: Record<string, FieldDefinition> = { ...baseSchema.properties };
    const report: SchemaMergeReport = {
      conflicts: [],
      merges: [],
      overwrites: [],
      manualReviewRequired: false,
    };

    const allKeys = new Set<string>([
      ...Object.keys(baseSchema.properties),
      ...Object.keys(newSchema.properties),
    ]);

    for (const key of allKeys) {
      const baseField = baseSchema.properties[key];
      const newField = newSchema.properties[key];

      if (!baseField && !newField) continue;

      if (!baseField) {
        // New field added
        mergedProperties[key] = newField;
        report.merges.push({
          field: key,
          source: `Schema ${sourceIndex} (New)`,
          description: `Field ${key} introduced from source ${sourceIndex}.`,
        });
        continue;
      }

      if (!newField) {
        // Field removed (or only exists in base)
        // We keep it unless a 'strict' strategy dictates otherwise, but for merging, we keep it.
        continue;
      }

      // Field exists in both, check for conflicts/merges
      if (key in baseSchema.properties && key in newSchema.properties) {
        const { mergedField, conflictReport, isConflict } = this.mergeField(
          baseField,
          newField,
          key,
          sourceIndex,
          totalSources
        );

        if (isConflict) {
          report.conflicts.push({
            field: key,
            base: baseField,
            new: newField,
            strategy: this.conflictStrategy,
            resolution: "Conflict detected, manual review needed.",
          });
          report.manualReviewRequired = true;
          mergedProperties[key] = baseField; // Default to base on conflict
        } else {
          mergedProperties[key] = mergedField;
          if (baseField !== newField) {
            if (this.conflictStrategy === "latest") {
              report.overwrites.push({
                field: key,
                base: baseField,
                new: newField,
                source: `Schema ${sourceIndex} (Overwrite)`,
                description: `Field ${key} overwritten by latest source ${sourceIndex}.`,
              });
            } else if (this.conflictStrategy === "union") {
              report.merges.push({
                field: key,
                base: baseField,
                new: newField,
                source: `Schema ${sourceIndex} (Merged)`,
                description: `Field ${key} successfully merged using union logic.`,
              });
            }
          }
        }
      } else {
        // Should not happen if logic above is correct, but handle fallback
        mergedProperties[key] = newField;
      }
    }

    return {
      merged: { type: "object", properties: mergedProperties } as SchemaDefinition,
      report: report,
    };
  }

  private mergeField(
    baseField: FieldDefinition,
    newField: FieldDefinition,
    key: string,
    sourceIndex: number,
    totalSources: number
  ): { mergedField: FieldDefinition; conflictReport: any; isConflict: boolean } {
    let mergedField: FieldDefinition = { ...baseField };
    let conflictReport: any = null;
    let isConflict = false;

    // 1. Type Conflict Check
    const baseType = baseField.type;
    const newType = newField.type;

    if (baseType !== newType) {
      if (this.conflictStrategy === "union") {
        // Attempt to merge types into a union
        const mergedType: string = `[${baseType}, ${newType}]`;
        mergedField = { type: "any", description: `Union of ${baseType} and ${newType}` } as FieldDefinition;
        conflictReport = {
          field: key,
          baseType: baseType,
          newType: newType,
          resolution: "Type union applied.",
        };
      } else if (this.conflictStrategy === "strict") {
        isConflict = true;
        conflictReport = {
          field: key,
          baseType: baseType,
          newType: newType,
          resolution: "Strict conflict: Type mismatch.",
        };
      } else { // latest
        // For 'latest', we usually prefer the new type if it's different, but this is complex.
        // For simplicity in this implementation, we treat type mismatch as a potential conflict
        // unless the new type is more general (e.g., union).
        isConflict = true;
        conflictReport = {
          field: key,
          baseType: baseType,
          newType: newType,
          resolution: "Type mismatch detected, manual review needed.",
        };
      }
    } else {
      // Types match, proceed to property merge if applicable
      if (baseType === "object" && newField.type === "object") {
        const { merged: mergedProps, report: propReport } = this.mergeObjectProperties(
          baseField.properties,
          newField.properties,
          key,
          sourceIndex,
          totalSources
        );
        mergedField = {
          type: "object",
          properties: mergedProps,
          description: baseField.description || newField.description,
        } as FieldDefinition;
        conflictReport = {
          field: key,
          baseProperties: baseField.properties,
          newProperties: newField.properties,
          resolution: "Object properties merged recursively.",
        };
      } else {
        // Simple type, just use the new field's definition (or base if 'latest' logic dictates)
        mergedField = { ...newField };
      }
    }

    return {
      mergedField,
      conflictReport,
      isConflict,
    };
  }

  private mergeObjectProperties(
    baseProps: Record<string, FieldDefinition>,
    newProps: Record<string, FieldDefinition>,
    parentKey: string,
    sourceIndex: number,
    totalSources: number
  ): { merged: Record<string, FieldDefinition>; report: SchemaMergeReport } {
    const mergedProps: Record<string, FieldDefinition> = { ...baseProps };
    const report: SchemaMergeReport = {
      conflicts: [],
      merges: [],
      overwrites: [],
      manualReviewRequired: false,
    };

    const allKeys = new Set<string>([
      ...Object.keys(baseProps),
      ...Object.keys(newProps),
    ]);

    for (const key of allKeys) {
      const baseField = baseProps[key];
      const newField = newProps[key];

      if (!baseField && !newField) continue;

      if (!baseField) {
        // New property added
        mergedProps[key] = newField;
        report.merges.push({
          field: `${parentKey}.${key}`,
          source: `Schema ${sourceIndex} (New)`,
          description: `Property ${key} introduced from source ${sourceIndex}.`,
        });
        continue;
      }

      if (!newField) {
        // Property removed (keep base)
        continue;
      }

      // Property exists in both
      const { mergedField, conflictReport, isConflict } = this.mergeField(
        baseField,
        newField,
        key,
        sourceIndex,
        totalSources
      );

      if (isConflict) {
        report.conflicts.push({
          field: `${parentKey}.${key}`,
          base: baseField,
          new: newField,
          strategy: this.conflictStrategy,
          resolution: "Conflict detected, manual review needed.",
        });
        report.manualReviewRequired = true;
        mergedProps[key] = baseField;
      } else {
        mergedProps[key] = mergedField;
        if (baseField !== newField) {
          if (this.conflictStrategy === "latest") {
            report.overwrites.push({
              field: `${parentKey}.${key}`,
              base: baseField,
              new: newField,
              source: `Schema ${sourceIndex} (Overwrite)`,
              description: `Property ${key} overwritten by latest source ${sourceIndex}.`,
            });
          } else if (this.conflictStrategy === "union") {
            report.merges.push({
              field: `${parentKey}.${key}`,
              base: baseField,
              new: newField,
              source: `Schema ${sourceIndex} (Merged)`,
              description: `Property ${key} successfully merged using union logic.`,
            });
          }
        }
      }
    }

    return { merged: mergedProps, report };
  }
}

export { StructuredToolOutputSchemaMergerV1013 };