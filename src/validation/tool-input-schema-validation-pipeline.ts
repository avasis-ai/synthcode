import { UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SchemaValidator {
  validate(input: Record<string, unknown>): ValidationResult;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  details: {
    validatorName: string;
    result: ValidationResult;
  }[];
}

export class ToolInputSchemaValidationPipeline {
  private validators: SchemaValidator[];

  constructor(validators: SchemaValidator[]) {
    this.validators = validators;
  }

  public validate(input: Record<string, unknown>): ValidationReport {
    const results: {
      validatorName: string;
      result: ValidationResult;
    }[] = [];
    const allErrors: string[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(input);
      results.push({
        validatorName: validator.constructor.name,
        result: result,
      });
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }

    const report: ValidationReport = {
      isValid: allErrors.length === 0,
      errors: allErrors,
      details: results,
    };

    return report;
  }
}