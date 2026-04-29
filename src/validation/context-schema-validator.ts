import { AgentContext } from "../types";

export interface ContextSchema {
  requiredFields: string[];
  fieldValidators: Record<string, (value: unknown) => { isValid: boolean; message: string }>;
  optionalChecks?: Record<string, (value: unknown) => { isValid: boolean; message: string }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ContextSchemaValidator {
  private schema: ContextSchema;

  constructor(schema: ContextSchema) {
    this.schema = schema;
  }

  public validate(context: AgentContext): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    // 1. Check for required fields
    for (const field of this.schema.requiredFields) {
      if (!context.state.hasOwnProperty(field) || context.state[field] === null || context.state[field] === undefined) {
        errors.push(`Missing required context field: ${field}`);
        isValid = false;
      }
    }

    // 2. Validate required fields using fieldValidators
    for (const field of this.schema.requiredFields) {
      if (context.state.hasOwnProperty(field) && typeof this.schema.fieldValidators[field] === 'function') {
        const validator = this.schema.fieldValidators[field];
        const value = context.state[field];
        const validation = validator(value);
        if (!validation.isValid) {
          errors.push(`Validation failed for required field ${field}: ${validation.message}`);
          isValid = false;
        }
      }
    }

    // 3. Validate optional fields using optionalChecks
    if (this.schema.optionalChecks) {
      for (const field in this.schema.optionalChecks) {
        if (Object.prototype.hasOwnProperty.call(this.schema.optionalChecks, field)) {
          const optionalValidator = this.schema.optionalChecks[field];
          const value = context.state[field];

          if (value !== undefined && value !== null) {
            const validation = optionalValidator(value);
            if (!validation.isValid) {
              errors.push(`Validation failed for optional field ${field}: ${validation.message}`);
              isValid = false;
            }
          }
        }
      }
    }

    return { isValid, errors: errors };
  }
}