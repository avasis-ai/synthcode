import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type ValidatorFunction<T> = (
  data: T,
  schema: any
) => ValidationResult;

export interface ValidationPipeline<T> {
  validators: ValidatorFunction<T>[];
  execute(data: T, schema: any): ValidationResult;
}

class StructuredToolOutputValidationPipeline<T> implements ValidationPipeline<T> {
  private validators: ValidatorFunction<T>[] = [];

  addValidator(validator: ValidatorFunction<T>): void {
    this.validators.push(validator);
  }

  execute(data: T, schema: any): ValidationResult {
    const allErrors: string[] = [];

    for (const validator of this.validators) {
      const result = validator(data, schema);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

export class StructuredToolOutputValidationPipelineV37 {
  private pipeline: StructuredToolOutputValidationPipeline<Record<string, unknown>>;

  constructor() {
    this.pipeline = new StructuredToolOutputValidationPipeline<Record<string, unknown>>();
    this.initializeValidators();
  }

  private initializeValidators(): void {
    this.pipeline.addValidator(this.validateRequiredFields);
    this.pipeline.addValidator(this.validateTypeConsistency);
    this.pipeline.addValidator(this.validateCrossFieldDependencies);
    this.pipeline.addValidator(this.validateTemporalConsistency);
  }

  public validate(output: Record<string, unknown>, schema: any): ValidationResult {
    return this.pipeline.execute(output, schema);
  }

  private validateRequiredFields(data: Record<string, unknown>, schema: any): ValidationResult {
    const requiredFields: string[] = schema?.required || [];
    const missingFields: string[] = requiredFields.filter(
      (field) => !(field in data) || data[field] === null || data[field] === undefined
    );

    if (missingFields.length > 0) {
      return {
        isValid: false,
        errors: [`Missing required fields: ${missingFields.join(', ')}`],
      };
    }
    return { isValid: true, errors: [] };
  }

  private validateTypeConsistency(data: Record<string, unknown>, schema: any): ValidationResult {
    const errors: string[] = [];
    const schemaTypes: Record<string, string> = schema?.typeMap || {};

    for (const key in schemaTypes) {
      if (Object.prototype.hasOwnProperty.call(schemaTypes, key)) {
        const expectedType = schemaTypes[key];
        const actualValue = data[key];

        if (actualValue !== undefined && typeof actualValue !== expectedType) {
          errors.push(
            `Type mismatch for field '${key}'. Expected ${expectedType}, got ${typeof actualValue}.`
          );
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateCrossFieldDependencies(data: Record<string, unknown>, schema: any): ValidationResult {
    const errors: string[] = [];
    const dependencies: {
      field: string;
      check: (data: Record<string, unknown>) => boolean;
      message: string;
    }[] = schema?.dependencies || [];

    for (const dep of dependencies) {
      if (!dep.check(data)) {
        errors.push(dep.message);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateTemporalConsistency(data: Record<string, unknown>, schema: any): ValidationResult {
    const errors: string[] = [];
    // Placeholder for complex temporal checks, e.g., ensuring timestamps are monotonically increasing
    if (schema?.temporalCheck && typeof data.timestamp === 'undefined') {
      errors.push("Temporal check failed: 'timestamp' field is missing.");
    }

    return { isValid: errors.length === 0, errors };
  }
}