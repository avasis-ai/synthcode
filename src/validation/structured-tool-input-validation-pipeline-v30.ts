import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

interface ValidationStep {
  execute: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

interface TemporalConstraintValidator {
  validateTemporal: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

class TemporalConstraintValidator implements TemporalConstraintValidator {
  validateTemporal(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const startTime = input["start_time"] as string | undefined;
    const endTime = input["end_time"] as string | undefined;

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        errors.push("Temporal fields must be valid ISO date strings.");
      } else if (start >= end) {
        errors.push("start_time must strictly precede end_time.");
      }
    } else if (startTime || endTime) {
      errors.push("Both start_time and end_time must be provided for temporal validation.");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...context }
    };
  }
}

class StructuredToolInputValidationPipelineV30 {
  private steps: ValidationStep[] = [];
  private temporalValidator: TemporalConstraintValidator;

  constructor() {
    this.temporalValidator = new TemporalConstraintValidator();
  }

  addStep(step: ValidationStep): StructuredToolInputValidationPipelineV30 {
    this.steps.push(step);
    return this;
  }

  addTemporalValidation(): StructuredToolInputValidationPipelineV30 {
    const temporalStep: ValidationStep = (input, context) => {
      return this.temporalValidator.validateTemporal(input, context);
    };
    this.steps.push(temporalStep);
    return this;
  }

  validate(input: Record<string, unknown>): ValidationResult {
    let currentContext: Record<string, unknown> = {};
    let currentResult: ValidationResult = {
      isValid: true,
      errors: [],
      context: {}
    };

    for (const step of this.steps) {
      const result = step.execute(input, currentContext);
      currentResult.isValid = currentResult.isValid && result.isValid;
      currentResult.errors = [...currentResult.errors, ...result.errors];
      currentContext = { ...currentContext, ...result.context };
    }

    return {
      isValid: currentResult.isValid,
      errors: currentResult.errors,
      context: currentContext
    };
  }
}

export { StructuredToolInputValidationPipelineV30, TemporalConstraintValidator };