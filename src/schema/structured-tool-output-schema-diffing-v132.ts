import {
  Schema,
  FieldSchema,
  SchemaDiffReport,
  DiffOperation,
} from "./schema-types";

type SchemaDiffReportV132 = SchemaDiffReport;

export class StructuredToolOutputSchemaDiffer {
  static diffSchemas(
    oldSchema: Schema,
    newSchema: Schema
  ): SchemaDiffReportV132 {
    const report: SchemaDiffReportV132 = {
      addedFields: [] as string[],
      removedFields: [] as string[],
      modifiedFields: [] as {
        field: string;
        oldValue: unknown;
        newValue: unknown;
        diff: string;
      }[],
      structuralChanges: [] as {
        path: string;
        changeType: DiffOperation;
        details: string;
      }[],
    };

    const oldFields = oldSchema.fields || {} as Record<string, FieldSchema>;
    const newFields = newSchema.fields || {} as Record<string, FieldSchema>;

    const allKeys = new Set([...Object.keys(oldFields), ...Object.keys(newFields)]);

    for (const key of allKeys) {
      const oldField = oldFields[key];
      const newField = newFields[key];

      if (!oldField) {
        report.addedFields.push(key);
        continue;
      }

      if (!newField) {
        report.removedFields.push(key);
        continue;
      }

      const fieldDiff = this.compareField(key, oldField, newField);
      if (fieldDiff) {
        report.modifiedFields.push(fieldDiff);
      }
    }

    return report;
  }

  private static compareField(
    fieldName: string,
    oldField: FieldSchema,
    newField: FieldSchema
  ): {
    field: string;
    oldValue: unknown;
    newValue: unknown;
    diff: string;
  } | null {
    const diff: string[] = [];
    let hasChange = false;

    // 1. Type comparison
    if (oldField.type !== newField.type) {
      diff.push(`Type changed from ${oldField.type} to ${newField.type}.`);
      hasChange = true;
    }

    // 2. Required status comparison
    if (oldField.required !== newField.required) {
      diff.push(
        `Required status changed from ${oldField.required ? 'true' : 'false'} to ${newField.required ? 'true' : 'false'}.`
      );
      hasChange = true;
    }

    // 3. Description comparison (simple check)
    if (oldField.description !== newField.description) {
      diff.push(`Description changed.`);
      hasChange = true;
    }

    // 4. Nested Schema comparison
    if (oldField.schema && newField.schema) {
      const nestedReport = this.diffSchemas(
        oldField.schema,
        newField.schema
      );
      if (nestedReport.addedFields.length > 0 ||
        nestedReport.removedFields.length > 0 ||
        nestedReport.modifiedFields.length > 0 ||
        nestedReport.structuralChanges.length > 0) {
        diff.push(`Nested schema changes detected: ${JSON.stringify(nestedReport)}`);
        hasChange = true;
      }
    } else if (oldField.schema && !newField.schema) {
      diff.push("Nested schema removed.");
      hasChange = true;
    } else if (!oldField.schema && newField.schema) {
      diff.push("Nested schema added.");
      hasChange = true;
    }

    if (hasChange) {
      return {
        field: fieldName,
        oldValue: oldField,
        newValue: newField,
        diff: diff.join('; '),
      };
    }

    return null;
  }
}