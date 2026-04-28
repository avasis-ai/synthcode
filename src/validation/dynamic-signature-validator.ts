import { ToolCall } from "./tool-call.js";

export interface Schema {
  type: "object";
  properties: Record<string, any>;
  required: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DynamicSignatureValidator {
  private schemaRegistry: Map<string, Schema>;

  constructor(initialSchemas: Record<string, Schema> = {}) {
    this.schemaRegistry = new Map(Object.entries(initialSchemas));
  }

  addSchema(name: string, schema: Schema): void {
    this.schemaRegistry.set(name, schema);
  }

  validate(toolCall: ToolCall, expectedSchemas: Record<string, Schema>): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    for (const [toolName, schema] of Object.entries(expectedSchemas)) {
      if (!schema) {
        errors.push(`Schema for tool "${toolName}" is missing.`);
        isValid = false;
        continue;
      }

      const callInput = toolCall.input;
      const requiredProps = schema.required || [];
      const properties = schema.properties;

      // 1. Check for missing required properties
      for (const prop of requiredProps) {
        if (!(prop in callInput) || callInput[prop] === undefined || callInput[prop] === null) {
          errors.push(`Tool "${toolName}" input is missing required property: "${prop}".`);
          isValid = false;
        }
      }

      // 2. Check for unexpected properties (optional, but good for strict validation)
      for (const key in callInput) {
        if (!properties[key] && !requiredProps.includes(key)) {
          // This check is basic; a real implementation would check types recursively.
          // For this scope, we just flag unknown keys if they aren't explicitly defined.
          // errors.push(`Tool "${toolName}" input contains unexpected property: "${key}".`);
          // isValid = false;
        }
      }
    }

    return {
      isValid: isValid && errors.length === 0,
      errors: errors,
    };
  }
}