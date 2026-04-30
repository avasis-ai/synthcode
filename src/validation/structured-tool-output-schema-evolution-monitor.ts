import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
}

interface Schema {
  [key: string]: SchemaField;
}

interface DriftReport {
  field: string;
  issue: "missing" | "type_mismatch" | "extra";
  details: string;
}

interface MonitorState {
  baselineSchema: Schema;
  lastKnownSchema: Schema;
  driftHistory: DriftReport[];
}

export class StructuredToolOutputSchemaEvolutionMonitor {
  private state: MonitorState;

  constructor(baselineSchema: Schema) {
    this.state = {
      baselineSchema: baselineSchema,
      lastKnownSchema: baselineSchema,
      driftHistory: [],
    };
  }

  private validateSchema(currentSchema: Schema): DriftReport[] {
    const reports: DriftReport[] = [];
    const lastSchema = this.state.lastKnownSchema;

    // 1. Check for missing or type-changed fields compared to the last known schema
    for (const fieldName in lastSchema) {
      const lastField = lastSchema[fieldName];
      const currentField = currentSchema[fieldName];

      if (!currentField) {
        reports.push({
          field: fieldName,
          issue: "missing",
          details: `Field '${fieldName}' is missing in the current schema.`,
        });
        continue;
      }

      if (lastField.type !== currentField.type) {
        reports.push({
          field: fieldName,
          issue: "type_mismatch",
          details: `Field '${fieldName}' type changed from '${lastField.type}' to '${currentField.type}'.`,
        });
      }
    }

    // 2. Check for extra fields in the current schema
    for (const fieldName in currentSchema) {
      if (!(fieldName in lastSchema)) {
        reports.push({
          field: fieldName,
          issue: "extra",
          details: `Field '${fieldName}' is present in the current schema but was not in the previous version.`,
        });
      }
    }

    return reports;
  }

  public processNewSchema(newSchema: Schema): {
    driftReport: DriftReport[];
    isSchemaValid: boolean;
  } {
    const driftReport = this.validateSchema(newSchema);
    const isSchemaValid = driftReport.length === 0;

    this.state.driftHistory.push(...driftReport);
    this.state.lastKnownSchema = newSchema;

    return {
      driftReport,
      isSchemaValid,
    };
  }

  public getHistory(): DriftReport[] {
    return [...this.state.driftHistory];
  }
}