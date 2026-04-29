import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type Validator<T> = (data: T, context: Record<string, any>) => ValidationResult;

interface ValidationContext {
  initialData: Record<string, unknown>;
  metadata: Record<string, any>;
}

export class StructuredToolOutputValidationChainBuilder {
  private schemaValidators: Validator<Record<string, unknown>>[] = [];
  private temporalValidators: (data: Record<string, unknown>, context: Record<string, any>) => ValidationResult[] = [];
  private crossFieldValidators: (data: Record<string, unknown>, context: Record<string, any>) => ValidationResult[] = [];

  constructor(
    private targetSchema: Record<string, unknown>,
    private initialContext: ValidationContext
  ) {}

  addSchemaValidator(validator: Validator<Record<string, unknown>>): this {
    this.schemaValidators.push(validator);
    return this;
  }

  addTemporalValidator(validator: (data: Record<string, unknown>, context: Record<string, any>) => ValidationResult[]): this {
    this.temporalValidators.push(validator);
    return this;
  }

  addCrossFieldValidator(validator: (data: Record<string, unknown>, context: Record<string, any>) => ValidationResult[]): this {
    this.crossFieldValidators.push(validator);
    return this;
  }

  private runValidators<T>(validators: Array<((data: T, context: Record<string, any>) => ValidationResult | ValidationResult[])>): (data: T, context: Record<string, any>) => ValidationResult[] {
    return (data, context) => {
      const allErrors: string[] = [];
      for (const validator of validators) {
        const result = validator(data, context);
        if (Array.isArray(result)) {
          allErrors.push(...result);
        } else if (!result.isValid) {
          allErrors.push(...result.errors);
        }
      }
      return allErrors;
    };
  }

  public build(): {
    validate: (data: Record<string, unknown>) => ValidationResult;
    getErrors: (data: Record<string, unknown>) => string[];
  } {
    const runSchemaValidators = this.runValidators<Record<string, unknown>>(this.schemaValidators);
    const runTemporalValidators = this.runValidators<Record<string, unknown>>(this.temporalValidators);
    const runCrossFieldValidators = this.runValidators<Record<string, unknown>>(this.crossFieldValidators);

    const validateChain = (data: Record<string, unknown>): ValidationResult => {
      const context = {
        initialData: data,
        metadata: this.initialContext.metadata,
      };

      const schemaErrors = runSchemaValidators(data, context);
      const temporalErrors = runTemporalValidators(data, context);
      const crossFieldErrors = runCrossFieldValidators(data, context);

      const allErrors: string[] = [...schemaErrors, ...temporalErrors, ...crossFieldErrors];

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
      };
    };

    const getErrors = (data: Record<string, unknown>): string[] => {
      const context = {
        initialData: data,
        metadata: this.initialContext.metadata,
      };
      const schemaErrors = runSchemaValidators(data, context);
      const temporalErrors = runTemporalValidators(data, context);
      const crossFieldErrors = runCrossFieldValidators(data, context);
      return [...schemaErrors, ...temporalErrors, ...crossFieldErrors];
    };

    return {
      validate: validateChain,
      getErrors: getErrors,
    };
  }
}