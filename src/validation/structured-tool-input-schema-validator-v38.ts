import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface CrossFieldValidator<T extends Record<string, unknown>> {
  validate(data: T): string | undefined;
}

export class StructuredToolInputSchemaValidator {
  private readonly schema: Record<string, any>;
  private readonly crossFieldValidators: CrossFieldValidator<any>[];

  constructor(schema: Record<string, any>, crossFieldValidators: CrossFieldValidator<any>[] = []) {
    this.schema = schema;
    this.crossFieldValidators = crossFieldValidators;
  }

  public validate(input: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Basic Schema Validation (Simplified for this context)
    for (const key in this.schema) {
      const expectedType = this.schema[key].type;
      const value = input[key];

      if (value === undefined) {
        if (this.schema[key].required) {
          errors.push(`Missing required field: ${key}`);
        }
        continue;
      }

      if (expectedType && typeof value !== expectedType) {
        errors.push(`Field '${key}' expected type ${expectedType}, but got ${typeof value}`);
      }
    }

    // 2. Cross-Field Validation
    for (const validator of this.crossFieldValidators) {
      const fieldError = validator.validate(input);
      if (fieldError) {
        errors.push(fieldError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}