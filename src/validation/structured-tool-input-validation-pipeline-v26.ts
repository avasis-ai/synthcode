import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

export type ValidatorStep = (
  inputs: Record<string, unknown>,
  context: Record<string, unknown>
) => {
  result: ValidationResult;
  newContext: Record<string, unknown>;
};

export interface TemporalConstraint {
  fieldA: string;
  fieldB: string;
  check: (valueA: unknown, valueB: unknown) => boolean;
  errorMessage: string;
}

export interface ValidationPipelineConfig {
  steps: ValidatorStep[];
  temporalConstraints?: TemporalConstraint[];
  enableTemporalValidation: boolean;
}

class StructuredToolInputValidationPipelineV26 {
  private config: ValidationPipelineConfig;

  constructor(config: ValidationPipelineConfig) {
    this.config = config;
  }

  private validateTemporalConstraints(inputs: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    if (!this.config.enableTemporalValidation || !this.config.temporalConstraints || this.config.temporalConstraints.length === 0) {
      return { isValid: true, errors: [], context: context };
    }

    const errors: string[] = [];
    let currentContext = { ...context };

    for (const constraint of this.config.temporalConstraints) {
      const valueA = inputs[constraint.fieldA];
      const valueB = inputs[constraint.fieldB];

      if (valueA !== undefined && valueB !== undefined) {
        if (!constraint.check(valueA, valueB)) {
          errors.push(constraint.errorMessage);
        }
      }
    }

    return { isValid: errors.length === 0, errors: errors, context: currentContext };
  }

  public validate(inputs: Record<string, unknown>): ValidationResult {
    let currentContext: Record<string, unknown> = {};
    let currentResult: ValidationResult = { isValid: true, errors: [], context: {} };

    // 1. Execute defined steps
    for (const step of this.config.steps) {
      const stepResult = step(inputs, currentContext);
      currentResult = stepResult.result;
      currentContext = stepResult.newContext;
    }

    // 2. Execute temporal validation if enabled
    const temporalResult = this.validateTemporalConstraints(inputs, currentContext);

    // Combine results
    const allErrors = [...currentResult.errors, ...temporalResult.errors];
    const overallIsValid = allErrors.length === 0;

    return {
      isValid: overallIsValid,
      errors: allErrors,
      context: temporalResult.context, // Use the context from the last validator
    };
  }
}

export { StructuredToolInputValidationPipelineV26 };