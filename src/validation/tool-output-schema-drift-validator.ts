import { Message } from "./message-types";

export interface SchemaDefinition {
  [key: string]: {
    required: boolean;
    type: "string" | "number" | "boolean" | "object";
    // Add more specific type checks if necessary, e.g., array length constraints
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ToolOutputSchemaDriftValidator {
  private readonly expectedSchema: SchemaDefinition;

  constructor(expectedSchema: SchemaDefinition) {
    this.expectedSchema = expectedSchema;
  }

  public validate(actualOutput: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    // 1. Check for missing required fields and unexpected keys
    const actualKeys = Object.keys(actualOutput);
    const expectedKeys = Object.keys(this.expectedSchema);

    // Check for missing required fields
    for (const key of expectedKeys) {
      const definition = this.expectedSchema[key];
      if (definition.required && !(key in actualOutput)) {
        errors.push(`Missing required field: "${key}"`);
        isValid = false;
      }
    }

    // Check for unexpected top-level keys (optional, but good for drift detection)
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key)) {
        errors.push(`Unexpected top-level key found: "${key}"`);
        // Depending on strictness, this might fail validation
        // For this implementation, we treat unexpected keys as warnings/errors if strict mode was available,
        // but for simplicity, we just report it.
        isValid = false;
      }
    }

    // 2. Check types for present fields
    for (const key of expectedKeys) {
      const definition = this.expectedSchema[key];
      if (key in actualOutput && definition.required) {
        const actualValue = actualOutput[key];

        if (typeof actualValue === 'undefined' || actualValue === null) {
          // This case should be caught by the 'required' check above, but included for robustness
          continue;
        }

        switch (definition.type) {
          case "string":
            if (typeof actualValue !== "string") {
              errors.push(`Type mismatch for "${key}": Expected string, got ${typeof actualValue}`);
              isValid = false;
            }
            break;
          case "number":
            if (typeof actualValue !== "number") {
              errors.push(`Type mismatch for "${key}": Expected number, got ${typeof actualValue}`);
              isValid = false;
            }
            break;
          case "boolean":
            if (typeof actualValue !== "boolean") {
              errors.push(`Type mismatch for "${key}": Expected boolean, got ${typeof actualValue}`);
              isValid = false;
            }
            break;
          case "object":
            if (typeof actualValue !== "object" || Array.isArray(actualValue) || actualValue === null) {
              errors.push(`Type mismatch for "${key}": Expected object, got ${typeof actualValue}`);
              isValid = false;
            }
            // Recursive check for nested objects could be added here
            break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}