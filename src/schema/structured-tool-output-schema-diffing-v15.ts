import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface SchemaDefinition {
  [key: string]: SchemaField;
}

export interface FieldDiff {
  field: string;
  changes: {
    type: "added" | "removed" | "modified";
    details: any;
  };
}

export interface SchemaDiffReport {
  fieldDiffs: FieldDiff[];
  isSignificantChange: boolean;
  summary: string;
}

class SchemaDiffEngine {
  private currentSchema: SchemaDefinition;
  private previousSchema: SchemaDefinition;

  constructor(currentSchema: SchemaDefinition, previousSchema: SchemaDefinition) {
    this.currentSchema = currentSchema;
    this.previousSchema = previousSchema;
  }

  private compareFields(currentField: SchemaField, previousField: SchemaField): {
    type: "modified";
    details: {
      type: string;
      required: boolean;
    };
  } {
    const typeChanged = currentField.type !== previousField.type;
    const requiredChanged = currentField.required !== previousField.required;

    if (typeChanged || requiredChanged) {
      return {
        type: "modified",
        details: {
          type: currentField.type,
          required: currentField.required,
        },
      };
    }
    return { type: "modified", details: { type: currentField.type, required: currentField.required } };
  }

  public diff(currentSchema: SchemaDefinition, previousSchema: SchemaDefinition): SchemaDiffReport {
    const fieldDiffs: FieldDiff[] = [];
    const allKeys = new Set<string>([
      ...Object.keys(currentSchema),
      ...Object.keys(previousSchema),
    ]);

    for (const key of allKeys) {
      const currentField = currentSchema[key];
      const previousField = previousSchema[key];

      if (!currentField && previousField) {
        fieldDiffs.push({
          field: key,
          changes: { type: "removed", details: previousField },
        });
        continue;
      }

      if (currentField && !previousField) {
        fieldDiffs.push({
          field: key,
          changes: { type: "added", details: currentField },
        });
        continue;
      }

      if (currentField && previousField) {
        const diff = this.compareFields(currentField, previousField);
        fieldDiffs.push({
          field: key,
          changes: { type: "modified", details: diff.details },
        });
      }
    }

    const significantChanges = fieldDiffs.some(diff =>
      diff.changes.type === "added" ||
      diff.changes.type === "removed" ||
      (diff.changes.type === "modified" && (
        (diff.changes.details as any).type !== (this.previousSchema[fieldDiffs.find(d => d.field === fieldDiffs.find(d => d.field === field.field)?.field)?.type || "") ||
        (diff.changes.details as any).required !== (this.previousSchema[fieldDiffs.find(d => d.field === fieldDiffs.find(d => d.field === field.field)?.field)?.required || false)
      ))
    );

    const summary = `Schema comparison complete. Found ${fieldDiffs.length} field changes. Significant structural changes detected: ${significantChanges}`;

    return {
      fieldDiffs,
      isSignificantChange: significantChanges,
      summary,
    };
  }
}

export class ToolOutputSchemaValidator {
  private previousSchema: SchemaDefinition | null = null;

  public validate(
    currentSchema: SchemaDefinition,
    toolOutput: Record<string, unknown>
  ): {
    isValid: boolean;
    report: SchemaDiffReport | null;
    message: string;
  } {
    let report: SchemaDiffReport | null = null;

    if (this.previousSchema) {
      const engine = new SchemaDiffEngine(currentSchema, this.previousSchema);
      report = engine.diff(currentSchema, this.previousSchema);
    }

    const schemaValid = this.validateAgainstSchema(currentSchema, toolOutput);

    if (report && !report.isSignificantChange) {
      return {
        isValid: schemaValid,
        report: report,
        message: "Schema structure is stable. Validation passed.",
      };
    }

    if (report && !report.isSignificantChange) {
        return {
            isValid: schemaValid,
            report: report,
            message: "Schema structure changed significantly. Manual review required, but validation passed against current schema.",
        };
    }

    if (!schemaValid) {
      return {
        isValid: false,
        report: report,
        message: "Tool output failed validation against the current schema.",
      };
    }

    return {
      isValid: true,
      report: report,
      message: "Tool output is valid and schema structure is stable.",
    };
  }

  private validateAgainstSchema(schema: SchemaDefinition, data: Record<string, unknown>): boolean {
    for (const key in schema) {
      const field = schema[key];
      const value = data[key];

      if (field.required && value === undefined) {
        return false;
      }

      if (value !== undefined) {
        if (typeof value !== field.type) {
          return false;
        }
      }
    }
    return true;
  }

  public setPreviousSchema(schema: SchemaDefinition): void {
    this.previousSchema = schema;
  }
}