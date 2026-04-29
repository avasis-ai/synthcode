import { Message, ToolResultMessage } from "./types";

type ValidatorFunction = (payload: Record<string, unknown>, context: Record<string, unknown>) => { isValid: boolean; errors: string[] };

interface ValidationStep {
  validator: (payload: Record<string, unknown>, context: Record<string, unknown>) => { isValid: boolean; errors: string[] };
  description: string;
}

export class StructuredToolOutputValidationChainBuilder {
  private schema: Record<string, unknown>;
  private steps: ValidationStep[] = [];

  constructor(schema: Record<string, unknown>) {
    this.schema = schema;
  }

  addRequiredFieldValidator(fieldName: string): StructuredToolOutputValidationChainBuilder {
    const validator: ValidatorFunction = (payload, context) => {
      if (!(fieldName in payload) || payload[fieldName] === null || payload[fieldName] === undefined) {
        return { isValid: false, errors: [`Field '${fieldName}' is required but missing or null.`] };
      }
      return { isValid: true, errors: [] };
    };
    this.steps.push({ validator, description: `Required field: ${fieldName}` });
    return this;
  }

  addTypeValidator(fieldName: string, expectedType: (value: unknown) => boolean): StructuredToolOutputValidationChainBuilder {
    const validator: ValidatorFunction = (payload, context) => {
      const value = payload[fieldName];
      if (value === undefined || value === null) {
        return { isValid: true, errors: [] }; // Handled by required check if necessary
      }
      if (!expectedType(value)) {
        return { isValid: false, errors: [`Field '${fieldName}' has incorrect type. Expected type check failed.`] };
      }
      return { isValid: true, errors: [] };
    };
    this.steps.push({ validator, description: `Type check for field: ${fieldName}` });
    return this;
  }

  addCrossFieldValidator(
    fieldNameA: string,
    fieldNameB: string,
    condition: (a: unknown, b: unknown) => boolean,
    errorMessage: string
  ): StructuredToolOutputValidationChainBuilder {
    const validator: ValidatorFunction = (payload, context) => {
      const valueA = payload[fieldNameA];
      const valueB = payload[fieldNameB];
      if (condition(valueA, valueB)) {
        return { isValid: true, errors: [] };
      }
      return { isValid: false, errors: [errorMessage] };
    };
    this.steps.push({ validator, description: `Cross-field validation: ${fieldNameA} vs ${fieldNameB}` });
    return this;
  }

  addTemporalValidator(
    fieldName: string,
    comparisonFn: (current: unknown, previous: unknown) => boolean,
    errorMessage: string
  ): StructuredToolOutputValidationChainBuilder {
    const validator: ValidatorFunction = (payload, context) => {
      const currentValue = payload[fieldName];
      const previousValue = context[fieldName];

      if (previousValue === undefined) {
        return { isValid: true, errors: [] }; // No previous context to validate against
      }

      if (!comparisonFn(currentValue, previousValue)) {
        return { isValid: false, errors: [`Temporal validation failed for '${fieldName}'. ${errorMessage}`] };
      }
      return { isValid: true, errors: [] };
    };
    this.steps.push({ validator, description: `Temporal validation for field: ${fieldName}` });
    return this;
  }

  build(): { validate: (payload: Record<string, unknown>, context?: Record<string, unknown>) => { isValid: boolean; errors: string[] } } {
    const validateChain = (payload: Record<string, unknown>, context: Record<string, unknown> = {}): { isValid: boolean; errors: string[] } => {
      const allErrors: string[] = [];
      let overallValid = true;

      for (const step of this.steps) {
        const result = step.validator(payload, context);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          overallValid = false;
        }
      }

      return { isValid: overallValid, errors: allErrors };
    };

    return { validate: validateChain };
  }
}