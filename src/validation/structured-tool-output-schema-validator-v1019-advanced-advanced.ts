import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SchemaDefinition {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object";
    required: boolean;
    schema?: Record<string, SchemaDefinition>;
  };
}

abstract class BaseValidator {
  abstract validate(data: unknown): ValidationResult;
}

class SchemaDriftValidator {
  private readonly baselineSchema: Record<string, SchemaDefinition>;

  constructor(baselineSchema: Record<string, SchemaDefinition>) {
    this.baselineSchema = baselineSchema;
  }

  validate(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const dataKeys = Object.keys(data);
    const baselineKeys = Object.keys(this.baselineSchema);

    // Check for missing required fields
    for (const key of baselineKeys) {
      const definition = this.baselineSchema[key];
      if (definition.required && !(key in data) || data[key] === null || (typeof data[key] === 'object' && Object.keys(data[key] as Record<string, unknown>).length === 0)) {
        errors.push(`Schema Drift: Missing or null required field '${key}' compared to baseline.`);
      }
    }

    // Check for unexpected fields (optional, but good for strict validation)
    for (const key of dataKeys) {
      if (!baselineKeys.includes(key)) {
        errors.push(`Schema Drift: Unexpected field '${key}' found in output.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

class TemporalValidator {
  validate(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const timestampKey = "timestamp"; // Assuming a common temporal field

    if (typeof data[timestampKey] === 'undefined') {
      errors.push("Temporal Constraint: Missing required 'timestamp' field.");
      return { isValid: false, errors };
    }

    const timestamp = data[timestampKey];
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      errors.push("Temporal Constraint: 'timestamp' must be a valid number.");
    } else {
      // Simple check: Ensure timestamp is not in the far future (e.g., more than 1 hour ahead)
      const now = Date.now();
      if (timestamp > now + (60 * 60 * 1000)) {
        errors.push("Temporal Constraint: 'timestamp' appears to be set too far in the future.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export class StructuredToolOutputSchemaValidatorV1019AdvancedAdvanced extends BaseValidator {
  private readonly schemaDriftValidator: SchemaDriftValidator;
  private readonly temporalValidator: TemporalValidator;
  private readonly baselineSchema: Record<string, SchemaDefinition>;

  constructor(baselineSchema: Record<string, SchemaDefinition>) {
    super();
    this.baselineSchema = baselineSchema;
    this.schemaDriftValidator = new SchemaDriftValidator(baselineSchema);
    this.temporalValidator = new TemporalValidator();
  }

  validate(data: unknown): ValidationResult {
    if (typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ["Input data must be a non-null object."] };
    }

    const output = data as Record<string, unknown>;
    const allErrors: string[] = [];

    // 1. Schema Drift Check
    const driftResult = this.schemaDriftValidator.validate(output);
    allErrors.push(...driftResult.errors);

    // 2. Temporal Consistency Check
    const temporalResult = this.temporalValidator.validate(output);
    allErrors.push(...temporalResult.errors);

    // 3. Cross-Field Validation (Example: Ensuring 'id' exists if 'status' is 'completed')
    if (output.status === "completed" && (typeof output.id === 'undefined' || String(output.id).length < 5)) {
      allErrors.push("Cross-Field Validation: If status is 'completed', 'id' must be present and sufficiently long.");
    }

    // 4. Type Validation (Basic check based on schema definition)
    const schemaValidationResult = this.validateAgainstSchema(output, this.baselineSchema);
    allErrors.push(...schemaValidationResult.errors);

    const finalIsValid = allErrors.length === 0;

    return {
      isValid: finalIsValid,
      errors: [...new Set(allErrors)], // Deduplicate errors
    };
  }

  private validateAgainstSchema(data: Record<string, unknown>, schema: Record<string, SchemaDefinition>): ValidationResult {
    const errors: string[] = [];
    for (const key in schema) {
      const definition = schema[key];
      const value = data[key];

      if (definition.required && (typeof value === 'undefined' || value === null)) {
        errors.push(`Type Validation: Required field '${key}' is missing.`);
        continue;
      }

      if (value === undefined || value === null) continue;

      switch (definition.type) {
        case "string":
          if (typeof value !== 'string') {
            errors.push(`Type Validation: Field '${key}' expected string, got ${typeof value}.`);
          }
          break;
        case "number":
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`Type Validation: Field '${key}' expected number, got ${typeof value}.`);
          }
          break;
        case "boolean":
          if (typeof value !== 'boolean') {
            errors.push(`Type Validation: Field '${key}' expected boolean, got ${typeof value}.`);
          }
          break;
        case "object":
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`Type Validation: Field '${key}' expected object, got ${typeof value}.`);
          } else if (definition.schema) {
            const nestedResult = this.validateAgainstSchema(value as Record<string, unknown>, definition.schema);
            errors.push(...nestedResult.errors.map(err => `[${key}]. ${err}`));
          }
          break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}