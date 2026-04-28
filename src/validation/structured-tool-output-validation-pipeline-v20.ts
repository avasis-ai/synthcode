import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type Schema = Record<string, any>;

export type ValidatorStep = (
  data: Record<string, unknown>
) => ValidationResult;

export class StructuredToolOutputValidator {
  private schema: Schema;
  private steps: ValidatorStep[];

  constructor(schema: Schema, steps: ValidatorStep[]) {
    this.schema = schema;
    this.steps = steps;
  }

  public validate(data: Record<string, unknown>): ValidationResult {
    let accumulatedErrors: string[] = [];

    // 1. Schema validation (Basic structure check)
    const schemaValidation = this.validateAgainstSchema(data);
    if (!schemaValidation.isValid) {
      accumulatedErrors = [...accumulatedErrors, ...schemaValidation.errors];
    }

    // 2. Pipeline execution (Custom semantic checks)
    for (const step of this.steps) {
      const result = step(data);
      if (!result.isValid) {
        accumulatedErrors = [...accumulatedErrors, ...result.errors];
      }
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
    };
  }

  private validateAgainstSchema(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const schema = this.schema;

    for (const key in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        const expectedType = schema[key];
        const value = data[key];

        if (expectedType.required && value === undefined) {
          errors.push(`Field '${key}' is required but missing.`);
          continue;
        }

        if (value !== undefined) {
          if (typeof expectedType === 'string') {
            const type = expectedType.toLowerCase();
            const actualType = typeof value;
            if (type === 'number' && actualType !== 'number') {
              errors.push(`Field '${key}' expected type number, got ${actualType}.`);
            } else if (type === 'string' && actualType !== 'string') {
              errors.push(`Field '${key}' expected type string, got ${actualType}.`);
            } else if (type === 'boolean' && actualType !== 'boolean') {
              errors.push(`Field '${key}' expected type boolean, got ${actualType}.`);
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export const createStructuredToolOutputValidator = (
  schema: Schema,
  steps: ValidatorStep[]
): StructuredToolOutputValidator => {
  return new StructuredToolOutputValidator(schema, steps);
};