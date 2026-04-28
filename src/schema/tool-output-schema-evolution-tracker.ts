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
}

export interface Schema {
  fields: Record<string, SchemaField>;
}

export interface EvolutionReport {
  history: {
    schema: Schema;
    timestamp: number;
  }[];
  summary: {
    total_steps: number;
    structural_changes: {
      added_fields: string[];
      removed_fields: string[];
      type_changes: {
        field: string;
        old_type: string;
        new_type: string;
      }[];
      optionality_shifts: {
        field: string;
        old_optional: boolean;
        new_optional: boolean;
      }[];
    };
    suggested_merger: string;
  };
}

export class ToolOutputSchemaEvolutionTracker {
  private history: {
    schema: Schema;
    timestamp: number;
  }[] = [];

  constructor() {}

  private getCurrentSchema(instance: Record<string, unknown>): Schema {
    const fields: Record<string, SchemaField> = {};
    for (const key in instance) {
      if (Object.prototype.hasOwnProperty.call(instance, key)) {
        const value = (instance as any)[key];
        let type: string;
        if (typeof value === 'string') {
          type = 'string';
        } else if (typeof value === 'number') {
          type = 'number';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (Array.isArray(value)) {
          type = 'array';
        } else if (typeof value === 'object' && value !== null) {
          type = 'object';
        } else {
          type = 'unknown';
        }

        fields[key] = {
          name: key,
          type: type,
          required: true, // Simplification: assume all fields present are required for this basic tracking
        };
      }
    }
    return { fields };
  }

  public ingestSchema(instance: Record<string, unknown>): void {
    const currentSchema = this.getCurrentSchema(instance);
    this.history.push({
      schema: currentSchema,
      timestamp: Date.now(),
    });
  }

  public generateReport(): EvolutionReport {
    if (this.history.length < 2) {
      return {
        history: this.history,
        summary: {
          total_steps: this.history.length,
          structural_changes: {
            added_fields: [],
            removed_fields: [],
            type_changes: [],
            optionality_shifts: [],
          },
          suggested_merger: "Not enough data points to detect evolution.",
        },
      };
    }

    const summary: {
      added_fields: string[];
      removed_fields: string[];
      type_changes: {
        field: string;
        old_type: string;
        new_type: string;
      }[];
      optionality_shifts: {
        field: string;
        old_optional: boolean;
        new_optional: boolean;
      }[];
    } = {
      added_fields: [],
      removed_fields: [],
      type_changes: [],
      optionality_shifts: [],
    };

    for (let i = 1; i < this.history.length; i++) {
      const previousSchema = this.history[i - 1].schema;
      const currentSchema = this.history[i].schema;

      const prevFields = previousSchema.fields;
      const currFields = currentSchema.fields;

      const allKeys = new Set<string>([...Object.keys(prevFields), ...Object.keys(currFields)]);

      for (const key of allKeys) {
        const prevField = prevFields[key];
        const currField = currFields[key];

        if (!prevField && currField) {
          summary.added_fields.push(key);
        } else if (prevField && !currField) {
          summary.removed_fields.push(key);
        } else if (prevField && currField) {
          if (prevField.type !== currField.type) {
            summary.type_changes.push({
              field: key,
              old_type: prevField.type,
              new_type: currField.type,
            });
          }
          // Optionality tracking is simplified here as we assume required=true unless explicitly changed
          // For this implementation, we only track if the field exists, implying required status change is complex.
        }
      }
    }

    const suggestedMerger = `Review the structural changes detected over ${this.history.length - 1} steps. Consider unifying types and handling the removal/addition of fields: Added=${[...new Set(summary.added_fields)]?.join(', ') || 'None'}, Removed=${[...new Set(summary.removed_fields)]?.join(', ') || 'None'}.`;

    return {
      history: this.history,
      summary: {
        total_steps: this.history.length,
        structural_changes: summary,
        suggested_merger: suggestedMerger,
      },
    };
  }
}