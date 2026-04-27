import { Message } from "./message";

export interface ValidationResult {
  isValid: boolean;
  finalInput: any;
  errors: string[];
}

export interface ValidationStep {
  validate(input: any, context: any): {
    isValid: boolean;
    result: any;
    error?: string;
  };
}

export class ToolInputPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(initialInput: any, context: any = {}): ValidationResult {
    let currentInput: any = initialInput;
    let errors: string[] = [];
    let isValid = true;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const validation = step.validate(currentInput, context);

      if (!validation.isValid) {
        errors.push(`Step ${i + 1} failed: ${validation.error || "Validation failed"}`);
        isValid = false;
        // Stop early if a critical step fails, or continue if designed to accumulate errors
        // For this implementation, we stop on the first failure to maintain integrity.
        break;
      }

      currentInput = validation.result;
    }

    return {
      isValid: isValid,
      finalInput: currentInput,
      errors: errors,
    };
  }
}