import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Schema = Record<string, FieldSchema>;

interface FieldSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description?: string;
  // Placeholder for more complex schema definitions
}

interface SchemaComparisonResult {
  addedFields: string[];
  removedFields: string[];
  changedFields: Record<string, {
    oldSchema: FieldSchema;
    newSchema: FieldSchema;
    diff: string;
  }>;
}

export class SchemaEvolutionValidator {
  private readonly baseSchema: Schema;
  private readonly newSchema: Schema;

  constructor(baseSchema: Schema, newSchema: Schema) {
    this.baseSchema = baseSchema;
    this.newSchema = newSchema;
  }

  private compareSchemas(): SchemaComparisonResult {
    const baseKeys = Object.keys(this.baseSchema);
    const newKeys = Object.keys(this.newSchema);

    const addedFields: string[] = [];
    const removedFields: string[]: string[] = [];
    const changedFields: Record<string, {
      oldSchema: FieldSchema;
      newSchema: FieldSchema;
      diff: string;
    }> = {};

    // Check for added and changed fields
    for (const key of newKeys) {
      const newSchema = this.newSchema[key];
      if (!this.baseSchema[key]) {
        addedFields.push(key);
        continue;
      }

      const baseSchema = this.baseSchema[key];
      if (baseSchema.type !== newSchema.type || baseSchema.required !== newSchema.required) {
        changedFields[key] = {
          oldSchema: baseSchema,
          newSchema: newSchema,
          diff: `Type changed from ${baseSchema.type} to ${newSchema.type} or requiredness changed.`,
        };
      }
    }

    // Check for removed fields
    for (const key of baseKeys) {
      if (!this.newSchema[key]) {
        removedFields.push(key);
      }
    }

    return {
      addedFields,
      removedFields,
      changedFields,
    };
  }

  private validateEvolutionRules(comparison: SchemaComparisonResult): string[] {
    const errors: string[] = [];

    // Rule 1: Must provide a migration path for removed fields
    for (const field of comparison.removedFields) {
      // In a real system, we'd check for a specific migration annotation/field
      if (!this.checkMigrationPathExists(field)) {
        errors.push(`Evolution Error: Field '${field}' was removed without specifying a migration path.`);
      }
    }

    // Rule 2: Deprecation warning for fields that changed type significantly
    for (const key in comparison.changedFields) {
      const change = comparison.changedFields[key];
      if (change.oldSchema.type === "string" && change.newSchema.type === "number") {
        errors.push(`Warning: Field '${key}' changed from string to number. Consider adding explicit casting logic.`);
      }
    }

    return errors;
  }

  private checkMigrationPathExists(fieldName: string): boolean {
    // Placeholder logic: Assume migration path exists if the field name contains 'v2'
    return fieldName.toLowerCase().includes("v2");
  }

  /**
   * Validates if the transition from baseSchema to newSchema adheres to defined evolution rules.
   * @returns An array of error messages; empty array if valid.
   */
  public validate(): string[] {
    const comparison = this.compareSchemas();
    const evolutionErrors = this.validateEvolutionRules(comparison);

    return [...evolutionErrors];
  }
}