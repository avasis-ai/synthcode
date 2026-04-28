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
  constraints?: {
    enum?: string[];
    pattern?: string;
  };
}

export interface StructuredSchema {
  fields: Record<string, SchemaField>;
}

export type SchemaDiff = {
  added: {
    fieldName: string;
    field: SchemaField;
  }[];
  deleted: string[];
  modified: {
    fieldName: string;
    oldField: SchemaField;
    newField: SchemaField;
    diffDetails: string;
  }[];
  incompatible: {
    fieldName: string;
    reason: string;
  }[];
};

export class SchemaDiffingUtility {
  private currentSchema: StructuredSchema;
  private previousSchema: StructuredSchema;

  constructor(currentSchema: StructuredSchema, previousSchema: StructuredSchema) {
    this.currentSchema = currentSchema;
    this.previousSchema = previousSchema;
  }

  private compareFields(
    fieldName: string,
    oldField: SchemaField,
    newField: SchemaField
  ): {
    diffDetails: string;
    isModified: boolean;
  } {
    let details: string[] = [];
    let isModified = false;

    if (oldField.type !== newField.type) {
      details.push(`Type changed from ${oldField.type} to ${newField.type}.`);
      isModified = true;
    }

    if (oldField.required !== newField.required) {
      details.push(
        `Required status changed from ${oldField.required} to ${newField.required}.`
      );
      isModified = true;
    }

    if (oldField.constraints?.enum?.length !== newField.constraints?.enum?.length) {
      details.push(
        `Enum constraint changed (count: ${oldField.constraints?.enum?.length} -> ${newField.constraints?.enum?.length}).`
      );
      isModified = true;
    }

    if (oldField.constraints?.pattern !== newField.constraints?.pattern) {
      details.push(
        `Regex pattern changed from ${oldField.constraints?.pattern} to ${newField.constraints?.pattern}.`
      );
      isModified = true;
    }

    if (details.length > 0) {
      return {
        diffDetails: details.join(" | "),
        isModified: true,
      };
    }

    return { diffDetails: "", isModified: false };
  }

  public diff(): SchemaDiff {
    const diff: SchemaDiff = {
      added: [],
      deleted: [],
      modified: [],
      incompatible: [],
    };

    const currentFields = this.currentSchema.fields;
    const previousFields = this.previousSchema.fields;

    // 1. Check for additions and modifications
    for (const fieldName in currentFields) {
      const newField = currentFields[fieldName];
      const oldField = previousFields[fieldName];

      if (!oldField) {
        diff.added.push({ fieldName, field: newField });
      } else {
        const { diffDetails, isModified } = this.compareFields(
          fieldName,
          oldField,
          newField
        );
        if (isModified) {
          diff.modified.push({
            fieldName,
            oldField,
            newField,
            diffDetails,
          });
        }
      }
    }

    // 2. Check for deletions
    for (const fieldName in previousFields) {
      if (!currentFields[fieldName]) {
        diff.deleted.push(fieldName);
      }
    }

    // 3. Check for incompatibilities (Simplified: e.g., type change from string to number)
    // A more complex system would check for specific incompatible transitions.
    // Here, we flag any modification that involves a fundamental type change as a potential incompatibility warning.
    for (const mod of diff.modified) {
      if (mod.oldField.type !== mod.newField.type) {
        diff.incompatible.push({
          fieldName: mod.fieldName,
          reason: `Fundamental type change detected: ${mod.oldField.type} -> ${mod.newField.type}. Review required.`,
        });
      }
    }

    return diff;
  }
}