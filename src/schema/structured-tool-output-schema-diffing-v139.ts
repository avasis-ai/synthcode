import {
  SchemaField,
  SchemaDefinition,
  SchemaDiff,
} from "./schema-types";

export class StructuredToolOutputSchemaDiffer {
  private schemaA: SchemaDefinition;
  private schemaB: SchemaDefinition;

  constructor(schemaA: SchemaDefinition, schemaB: SchemaDefinition) {
    this.schemaA = schemaA;
    this.schemaB = schemaB;
  }

  public diffSchemas(): SchemaDiff {
    const diff: SchemaDiff = {
      addedFields: [],
      removedFields: [],
      modifiedFields: [],
      summary: {
        isCompatible: true,
        warnings: [],
        errors: [],
      },
    };

    const allKeys = new Set<string>([
      ...Object.keys(this.schemaA.properties || {}),
      ...Object.keys(this.schemaB.properties || {}),
    ]);

    for (const key of allKeys) {
      const fieldA = (this.schemaA.properties || {})[key];
      const fieldB = (this.schemaB.properties || {})[key];

      if (!fieldA && fieldB) {
        diff.addedFields.push({
          name: key,
          details: fieldB,
        });
      } else if (fieldA && !fieldB) {
        diff.removedFields.push({
          name: key,
          details: fieldA,
        });
      } else if (fieldA && fieldB) {
        const fieldDiff = this.compareField(key, fieldA, fieldB);
        if (fieldDiff) {
          if (fieldDiff.type === "modified") {
            diff.modifiedFields.push({
              name: key,
              diff: fieldDiff,
            });
          } else if (fieldDiff.type === "added" || fieldDiff.type === "removed") {
            // Should not happen if logic is correct, but for completeness
            if (fieldDiff.type === "added") {
                diff.addedFields.push({ name: key, details: fieldDiff.details });
            } else {
                diff.removedFields.push({ name: key, details: fieldDiff.details });
            }
          }
        }
      }
    }

    this.analyzeCompatibility(diff);
    return diff;
  }

  private compareField(
    name: string,
    fieldA: SchemaField,
    fieldB: SchemaField,
  ): SchemaDiff | null {
    const diff: SchemaDiff = {
      addedFields: [],
      removedFields: [],
      modifiedFields: [],
      summary: {
        isCompatible: true,
        warnings: [],
        errors: [],
      },
    };

    let isModified = false;

    // 1. Type Check
    if (fieldA.type !== fieldB.type) {
      diff.modifiedFields.push({
        name: "type",
        oldValue: fieldA.type,
        newValue: fieldB.type,
        description: `Type changed from ${fieldA.type} to ${fieldB.type}.`,
      });
      isModified = true;
    }

    // 2. Required Status Check
    if (fieldA.required !== fieldB.required) {
      diff.modifiedFields.push({
        name: "required",
        oldValue: fieldA.required,
        newValue: fieldB.required,
        description: `Required status changed from ${fieldA.required ? "true" : "false"} to ${fieldB.required ? "true" : "false"}.`,
      });
      isModified = true;
    }

    // 3. Description/Example Check (Simple comparison)
    if (fieldA.description !== fieldB.description) {
      diff.modifiedFields.push({
        name: "description",
        oldValue: fieldA.description,
        newValue: fieldB.description,
        description: "Description has changed.",
      });
      isModified = true;
    }

    // 4. Nested Schema Comparison (if applicable)
    if (fieldA.type === "object" && fieldA.properties && fieldB.type === "object" && fieldB.properties) {
      const nestedDiff = new StructuredToolOutputSchemaDiffer(
        fieldA as SchemaDefinition,
        fieldB as SchemaDefinition,
      ).diffSchemas();

      if (nestedDiff.modifiedFields.length > 0 || nestedDiff.addedFields.length > 0 || nestedDiff.removedFields.length > 0) {
        diff.modifiedFields.push({
          name: "properties",
          oldValue: fieldA.properties,
          newValue: fieldB.properties,
          description: "Nested object structure changed. See nested diff for details.",
          nestedDiff: nestedDiff,
        });
        isModified = true;
      }
    }

    if (isModified) {
      return {
        type: "modified",
        details: {
          name: name,
          diff: diff.modifiedFields,
          summary: {
            ...diff.summary,
            isCompatible: true, // Assume compatible unless explicit error found
          },
        },
      };
    }

    return null;
  }

  private analyzeCompatibility(diff: SchemaDiff): void {
    const summary = diff.summary;
    let compatible = true;

    // Check for required field removals (Potential breaking change)
    for (const field of diff.removedFields) {
      const fieldA = field.details;
      if (fieldA.required) {
        summary.warnings.push(
          `Field '${field.name}' was required in Schema A but is now removed. Downstream consumers expecting this field will fail.`,
        );
        compatible = false;
      }
    }

    // Check for type changes on non-optional fields (Potential breaking change)
    for (const field of diff.modifiedFields) {
      const fieldDiff = field.diff;
      if (fieldDiff.diff.some(d => d.name === "type" && d.oldValue !== d.newValue)) {
        const fieldA = (this.schemaA.properties || {})[field.name];
        const fieldB = (this.schemaB.properties || {})[field.name];

        if (fieldA?.required && fieldB?.type !== fieldA?.type) {
          summary.errors.push(
            `CRITICAL: Required field '${field.name}' changed type from ${fieldA.type} to ${fieldB.type}. This is likely a breaking change.`,
          );
          compatible = false;
        }
      }
    }

    // Check for required field additions (Non-breaking, but needs attention)
    for (const field of diff.addedFields) {
      const fieldB = field.details;
      if (fieldB.required) {
        summary.warnings.push(
          `Field '${field.name}' was added and is required. Ensure all calling contexts provide this field.`,
        );
      }
    }

    summary.isCompatible = compatible;
  }
}