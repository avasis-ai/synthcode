import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface ValidationStep {
  validate(data: any, context: any): ValidationResult;
}

export class StructuredToolOutputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(data: any, context: any): ValidationResult {
    let aggregatedErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.validate(data, context);
      if (!result.isValid) {
        aggregatedErrors = aggregatedErrors.concat(result.errors);
      }
    }

    return {
      isValid: aggregatedErrors.length === 0,
      errors: aggregatedErrors,
    };
  }

  public static create(steps: ValidationStep[]): StructuredToolOutputValidationPipeline {
    return new StructuredToolOutputValidationPipeline(steps);
  }
}

class TypeValidatorStep implements ValidationStep {
  private requiredType: string;

  constructor(requiredType: string) {
    this.requiredType = requiredType;
  }

  public validate(data: any, context: any): ValidationResult {
    const isValid = typeof data === this.requiredType;
    return {
      isValid,
      errors: isValid ? [] : [`Expected type '${this.requiredType}', but got '${typeof data}'`],
    };
  }
}

class ConstraintValidatorStep implements ValidationStep {
  private constraint: (value: any) => boolean;
  private errorMessage: string;

  constructor(constraint: (value: any) => boolean, errorMessage: string) {
    this.constraint = constraint;
    this.errorMessage = errorMessage;
  }

  public validate(data: any, context: any): ValidationResult {
    const isValid = this.constraint(data);
    return {
      isValid,
      errors: isValid ? [] : [this.errorMessage],
    };
  }
}

export const createRequiredStringStep = (): ValidationStep => {
  return new TypeValidatorStep("string");
};

export const createNumberStep = (): ValidationStep => {
  return new TypeValidatorStep("number");
};

export const createMinLengthStep = (minLength: number): ValidationStep => {
  return new ConstraintValidatorStep(
    (value: any): boolean => typeof value === 'string' && value.length >= minLength,
    `Must be at least ${minLength} characters long.`
  );
};

export const createIsPositiveStep = (): ValidationStep => {
  return new ConstraintValidatorStep(
    (value: any): boolean => typeof value === 'number' && value > 0,
    "Must be a positive number."
  );
};