import {
  SchemaDefinition,
  FieldSchema,
  SchemaEvolutionReport,
} from "../types";

export class StructuredToolOutputSchemaEvolutionValidatorV1 {
  validate(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition,
    data: Record<string, unknown>
  ): SchemaEvolutionReport {
    const report: SchemaEvolutionReport = {
      isSchemaDriftDetected: false,
      fieldChanges: [],
      missingFields: [],
      unexpectedFields: [],
    };

    const oldFields = oldSchema.fields || {};
    const newFields = newSchema.fields || {};

    const allKeys = new Set<string>([
      ...Object.keys(oldFields),
      ...Object.keys(newFields),
    ]);

    for (const key of allKeys) {
      const oldField = oldFields[key];
      const newField = newFields[key];

      if (!oldField && newField) {
        report.unexpectedFields.push(key);
        report.isSchemaDriftDetected = true;
      } else if (oldField && !newField) {
        report.missingFields.push(key);
        report.isSchemaDriftDetected = true;
      } else if (oldField && newField) {
        const fieldChange = this.compareField(key, oldField, newField, data);
        if (fieldChange) {
          report.fieldChanges.push(fieldChange);
          if (fieldChange.hasDrift) {
            report.isSchemaDriftDetected = true;
          }
        }
      }
    }

    return report;
  }

  private compareField(
    fieldName: string,
    oldField: FieldSchema,
    newField: FieldSchema,
    data: Record<string, unknown>
  ): { hasDrift: boolean; details: any } | null {
    let hasDrift = false;
    const details: any = {
      fieldName,
      old: oldField,
      new: newField,
      dataValue: data[fieldName],
      drift: {
        type: null,
        required: null,
        description: null,
      },
    };

    // 1. Type Comparison
    const oldType = oldField.type;
    const newType = newField.type;
    if (oldType !== newType) {
      details.drift.type = {
        old: oldType,
        new: newType,
        message: `Type changed from ${oldType} to ${newType}.`,
      };
      hasDrift = true;
    }

    // 2. Required Status Comparison
    const oldRequired = oldField.required;
    const newRequired = newField.required;
    if (oldRequired !== newRequired) {
      details.drift.required = {
        old: oldRequired,
        new: newRequired,
        message: `Required status changed from ${oldRequired} to ${newRequired}.`,
      };
      hasDrift = true;
    }

    // 3. Description/Constraints (Simplified comparison)
    if (oldField.description !== newField.description) {
      details.drift.description = {
        old: oldField.description,
        new: newField.description,
        message: "Description changed.",
      };
      hasDrift = true;
    }

    // 4. Data Validation Check (If the data violates the new schema)
    if (data[fieldName] !== undefined) {
      const dataValue = data[fieldName];
      if (typeof dataValue !== 'object' || dataValue === null) {
        // Skip deep validation if the data itself is not an object (e.g., primitive type mismatch)
      } else {
        // Basic check: if the new field expects an object, ensure the data is structured enough
        if (newField.type === "object" && typeof dataValue !== "object") {
          details.drift.dataValidation = {
            message: `Expected object structure for field '${fieldName}', but received ${typeof dataValue}.`,
          };
          hasDrift = true;
        }
      }
    }

    return hasDrift ? { hasDrift: true, details } : null;
  }
}