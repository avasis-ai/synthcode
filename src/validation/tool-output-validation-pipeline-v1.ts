import { Message, ToolResultMessage } from "./types";

export interface ValidationStep {
  validate(input: any): { isValid: boolean; result: any; error?: string };
}

export interface ValidationResult {
  success: boolean;
  finalResult: any;
  errors: string[];
}

export class ToolOutputValidationPipeline {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): void {
    this.steps.push(step);
  }

  run(input: any): ValidationResult {
    let currentResult: any = input;
    const errors: string[] = [];

    for (const step of this.steps) {
      const validation = step.validate(currentResult);

      if (!validation.isValid) {
        errors.push(`Validation failed at step: ${step.constructor.name}. Error: ${validation.error || 'Unknown error'}`);
        return {
          success: false,
          finalResult: currentResult,
          errors: errors,
        };
      }

      currentResult = validation.result;
    }

    return {
      success: true,
      finalResult: currentResult,
      errors: [],
    };
  }
}