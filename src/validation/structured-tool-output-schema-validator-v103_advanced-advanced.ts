import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface SchemaEvolutionValidator {
  validate(
    history: SchemaHistory,
    proposedSchema: Record<string, any>
  ): { isValid: boolean; errors: string[] };
}

export interface SchemaHistory {
  schemas: Array<{ version: number; schema: Record<string, any> }>;
  lastVersion: number;
}

interface FieldDefinition {
  type: string;
  required: boolean;
  description?: string;
}

export class StructuredToolOutputSchemaValidatorV103AdvancedAdvanced implements SchemaEvolutionValidator {
  validate(
    history: SchemaHistory,
    proposedSchema: Record<string, any>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const historySchemas = history.schemas;

    if (!historySchemas || historySchemas.length === 0) {
      return { isValid: true, errors: [] };
    }

    const currentSchema = historySchemas[historySchemas.length - 1].schema;
    const lastVersion = history.lastVersion;

    // 1. Check for breaking changes against all previous versions
    for (let i = 0; i < historySchemas.length; i++) {
      const historicalSchema = historySchemas[i].schema;
      const historicalVersion = historySchemas[i].version;

      // Check if any required field in the historical schema is missing or changed type in the proposed schema
      for (const key in historicalSchema) {
        if (Object.prototype.hasOwnProperty.call(historicalSchema, key)) {
          const historicalField = historicalSchema[key];
          const proposedField = proposedSchema[key];

          if (historicalField && historicalField.required && !proposedField) {
            errors.push(`Breaking Change Detected: Required field '${key}' present in version ${historicalVersion} is missing in the proposed schema.`);
          }
          
          // Basic type check simulation (assuming schema defines expected types)
          if (historicalField.type && proposedField && typeof proposedField !== 'object' && historicalField.type !== 'any') {
              // Simplified check: if the type definition implies an object, and the proposed is not, flag it.
              if (historicalField.type === 'object' && typeof proposedField !== 'object' || proposedField === null) {
                errors.push(`Potential Type Mismatch: Field '${key}' expected type ${historicalField.type} (from version ${historicalVersion}), but proposed schema suggests incompatible type.`);
              }
          }
        }
      }
    }

    // 2. Check for non-breaking additions (optional, but good practice)
    // This is complex, so we focus on ensuring new fields are documented/optional if they aren't critical.
    const existingKeys = Object.keys(currentSchema);
    for (const key in proposedSchema) {
        if (!existingKeys.includes(key) && !Object.prototype.hasOwnProperty.call(currentSchema, key)) {
            // New field detected. Assume non-breaking unless explicitly marked otherwise.
            // We just log it for review, not an error.
        }
    }

    const isValid = errors.length === 0;

    return {
      isValid: isValid,
      errors: errors
    };
  }
}