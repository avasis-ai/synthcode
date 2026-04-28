import { Message, ToolResultMessage } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface StructuredToolOutputValidationStep {
  validate(output: ToolResultMessage): ValidationResult;
}

export interface CrossFieldDependencyValidator {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult;
}

export interface TemporalConsistencyValidator {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult;
}

export class StructuredToolOutputValidationPipelineV50 {
  private steps: StructuredToolOutputValidationStep[] = [];
  private crossFieldValidators: CrossFieldDependencyValidator[] = [];
  private temporalValidators: TemporalConsistencyValidator[] = [];

  private constructor() {}

  public static build(): StructuredToolOutputValidationPipelineV50 {
    return new StructuredToolOutputValidationPipelineV50();
  }

  public addStep(step: StructuredToolOutputValidationStep): StructuredToolOutputValidationPipelineV50 {
    this.steps.push(step);
    return this;
  }

  public addCrossFieldValidator(validator: CrossFieldDependencyValidator): StructuredToolOutputValidationPipelineV50 {
    this.crossFieldValidators.push(validator);
    return this;
  }

  public addTemporalValidator(validator: TemporalConsistencyValidator): StructuredToolOutputValidationPipelineV50 {
    this.temporalValidators.push(validator);
    return this;
  }

  public validate(output: ToolResultMessage, context: Record<string, any> = {}): ValidationResult {
    let allErrors: string[] = [];

    // 1. Run basic steps
    for (const step of this.steps) {
      const result = step.validate(output);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
      }
    }

    // 2. Run cross-field dependencies
    for (const validator of this.crossFieldValidators) {
      const result = validator.validate(output, context);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
      }
    }

    // 3. Run temporal consistency checks
    for (const validator of this.temporalValidators) {
      const result = validator.validate(output, context);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
      }
    }

    const finalResult: ValidationResult = {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };

    return finalResult;
  }
}

export const createBasicStep = (
  validator: (output: ToolResultMessage) => { isValid: boolean; errors: string[] }
): StructuredToolOutputValidationStep => ({
  validate(output: ToolResultMessage): ValidationResult {
    const result = validator(output);
    return {
      isValid: result.isValid,
      errors: result.errors,
    };
  },
});

export const createCrossFieldStep = (
  validator: (output: ToolResultMessage, context: Record<string, any>) => { isValid: boolean; errors: string[] }
): StructuredToolOutputValidationStep & { validate: (output: ToolResultMessage) => ValidationResult } => ({
  validate(output: ToolResultMessage): ValidationResult {
    // For basic step execution, we pass an empty context if none is provided by the pipeline runner
    return {
      isValid: validator(output, {}).isValid,
      errors: validator(output, {}).errors,
    };
  },
});

export const TemporalConsistencyValidatorImpl: TemporalConsistencyValidator = {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    // Placeholder for complex temporal logic (e.g., checking timestamps against context)
    if (output.content.includes("timestamp_error")) {
      errors.push("Temporal validation failed: Content suggests an invalid sequence or outdated time marker.");
    }
    return { isValid: errors.length === 0, errors };
  },
};

export const CrossFieldDependencyValidatorImpl: CrossFieldDependencyValidator = {
  validate(output: ToolResultMessage, context: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    // Placeholder for cross-field logic (e.g., checking if 'tool_use_id' exists in context)
    if (!context.tool_use_id && output.content.includes("dependency_check")) {
      errors.push("Cross-field validation failed: Required context 'tool_use_id' missing for dependency check.");
    }
    return { isValid: errors.length === 0, errors };
  },
};