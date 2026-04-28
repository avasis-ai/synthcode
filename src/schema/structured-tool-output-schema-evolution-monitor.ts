import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface Schema {
  [key: string]: SchemaField;
}

export interface ChangeDetail {
  field: string;
  detectedChange: string;
  baselineValue: any;
  currentValue: any;
}

export interface EvolutionReport {
  baselineSchema: Schema;
  currentSchema: Schema;
  changes: ChangeDetail[];
  suggestions: {
    field: string;
    issue: string;
    recommendation: string;
  }[];
}

export class StructuredToolOutputSchemaEvolutionMonitor {
  private baselineSchema: Schema;

  constructor(baselineSchema: Schema) {
    this.baselineSchema = baselineSchema;
  }

  private getFieldType(field: SchemaField): string {
    return field.type;
  }

  private compareSchemas(baseline: Schema, current: Schema): {
    changes: ChangeDetail[];
    suggestions: {
      field: string;
      issue: string;
      recommendation: string;
    }[];
  } {
    const changes: ChangeDetail[] = [];
    const suggestions: {
      field: string;
      issue: string;
      recommendation: string;
    }[] = [];

    const allFields = new Set<string>([
      ...Object.keys(baseline),
      ...Object.keys(current),
    ]);

    for (const fieldName of allFields) {
      const baselineField = baseline[fieldName];
      const currentField = current[fieldName];

      if (!baselineField && currentField) {
        changes.push({
          field: fieldName,
          detectedChange: "Added",
          baselineValue: undefined,
          currentValue: currentField.type,
        });
        suggestions.push({
          field: fieldName,
          issue: "New field detected.",
          recommendation: "Consider updating consumer logic to handle this new optional field.",
        });
        continue;
      }

      if (baselineField && !currentField) {
        changes.push({
          field: fieldName,
          detectedChange: "Removed",
          baselineValue: baselineField.type,
          currentValue: undefined,
        });
        suggestions.push({
          field: fieldName,
          issue: "Field removed.",
          recommendation: "Review if this field is still necessary. If so, update the baseline schema.",
        });
        continue;
      }

      if (baselineField && currentField) {
        if (baselineField.type !== currentField.type) {
          changes.push({
            field: fieldName,
            detectedChange: "Type Changed",
            baselineValue: baselineField.type,
            currentValue: currentField.type,
          });
          suggestions.push({
            field: fieldName,
            issue: `Type mismatch detected.`,
            recommendation: `Field '${fieldName}' changed from ${baselineField.type} to ${currentField.type}. Update consumer logic accordingly.`,
          });
        } else if (baselineField.required !== currentField.required) {
          changes.push({
            field: fieldName,
            detectedChange: "Required Status Changed",
            baselineValue: baselineField.required ? "true" : "false",
            currentValue: currentField.required ? "true" : "false",
          });
          suggestions.push({
            field: fieldName,
            issue: "Required status changed.",
            recommendation: "Adjust validation logic based on the new required status.",
          });
        }
      }
    }

    return { changes, suggestions };
  }

  public generateReport(currentSchema: Schema): EvolutionReport {
    const { changes, suggestions } = this.compareSchemas(
      this.baselineSchema,
      currentSchema
    );

    return {
      baselineSchema: this.baselineSchema,
      currentSchema: currentSchema,
      changes: changes,
      suggestions: suggestions,
    };
  }
}