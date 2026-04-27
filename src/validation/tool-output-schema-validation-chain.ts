import { Message } from "./message-types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SchemaValidator {
  validate(output: any): ValidationResult;
}

export class ToolOutputSchemaValidationChain {
  private validators: SchemaValidator[];

  constructor(validators: SchemaValidator[]) {
    this.validators = validators;
  }

  validate(output: any, collectAllErrors: boolean = true): ValidationResult {
    const allErrors: string[] = [];
    let firstError: string | null = null;

    for (const validator of this.validators) {
      const result = validator.validate(output);
      if (!result.isValid) {
        if (collectAllErrors) {
          allErrors.push(...result.errors);
        } else if (!firstError) {
          firstError = result.errors.join("; ");
        }
      }
    }

    const isValid = allErrors.length === 0;

    return {
      isValid: isValid,
      errors: collectAllErrors ? allErrors : (firstError ? [firstError] : []),
    };
  }
}