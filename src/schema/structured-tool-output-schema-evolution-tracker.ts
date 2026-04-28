import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface SchemaField {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

export interface Schema {
  type: "object";
  properties: Record<string, SchemaField>;
  required: string[];
}

export interface SchemaEvolutionReport {
  toolName: string;
  initialSchema: Schema;
  history: {
    version: number;
    schema: Schema;
    report: {
      addedFields: string[];
      removedFields: string[];
      changedFields: {
        fieldName: string;
        oldType: string;
        newType: string;
      }[];
    };
  }[];
}

export class StructuredToolOutputSchemaEvolutionTracker {
  private readonly toolName: string;
  private currentSchema: Schema | null = null;
  private history: SchemaEvolutionReport["history"] = [];

  constructor(toolName: string, initialSchema: Schema) {
    this.toolName = toolName;
    this.currentSchema = initialSchema;
    this.history.push({
      version: 1,
      schema: initialSchema,
      report: {
        addedFields: [],
        removedFields: [],
        changedFields: [],
      },
    });
  }

  private compareSchemas(oldSchema: Schema, newSchema: Schema): {
    addedFields: string[];
    removedFields: string[];
    changedFields: {
      fieldName: string;
      oldType: string;
      newType: string;
    }[];
  } {
    const oldProps = oldSchema.properties;
    const newProps = newSchema.properties;

    const addedFields: string[] = [];
    const removedFields: string[] = [];
    const changedFields: {
      fieldName: string;
      oldType: string;
      newType: string;
    }[] = [];

    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

    for (const key of allKeys) {
      const oldField = oldProps[key];
      const newField = newProps[key];

      if (!oldField && newField) {
        addedFields.push(key);
      } else if (oldField && !newField) {
        removedFields.push(key);
      } else if (oldField && newField) {
        if (oldField.type !== newField.type) {
          changedFields.push({
            fieldName: key,
            oldType: oldField.type,
            newType: newField.type,
          });
        }
      }
    }

    return {
      addedFields,
      removedFields,
      changedFields,
    };
  }

  public ingestSchema(newSchema: Schema): {
    report: SchemaEvolutionReport;
    reportDetails: {
      addedFields: string[];
      removedFields: string[];
      changedFields: {
        fieldName: string;
        oldType: string;
        newType: string;
      }[];
    };
  } {
    if (!this.currentSchema) {
      throw new Error("Schema must be initialized before ingesting.");
    }

    const comparison = this.compareSchemas(this.currentSchema, newSchema);

    const newHistoryEntry: SchemaEvolutionReport["history"][0] = {
      version: this.history.length + 1,
      schema: newSchema,
      report: {
        addedFields: comparison.addedFields,
        removedFields: comparison.removedFields,
        changedFields: comparison.changedFields,
      },
    };

    this.history.push(newHistoryEntry);
    this.currentSchema = newSchema;

    const finalReport: SchemaEvolutionReport = {
      toolName: this.toolName,
      initialSchema: this.history[0].schema,
      history: [...this.history],
    };

    return {
      report: finalReport,
      reportDetails: {
        addedFields: comparison.addedFields,
        removedFields: comparison.removedFields,
        changedFields: comparison.changedFields,
      },
    };
  }

  public getEvolutionReport(): SchemaEvolutionReport {
    return {
      toolName: this.toolName,
      initialSchema: this.history[0].schema,
      history: [...this.history],
    };
  }
}