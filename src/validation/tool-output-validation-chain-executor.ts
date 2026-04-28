import { Message } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data: any;
}

export interface ValidationStep {
  execute: (input: any) => ValidationResult;
}

export class ToolOutputValidationChainExecutor {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public execute(input: any): ValidationResult {
    let currentData: any = input;
    let overallResult: ValidationResult = {
      isValid: true,
      errors: [],
      data: input,
    };

    for (const step of this.steps) {
      const stepResult = step.execute(currentData);

      if (!stepResult.isValid) {
        overallResult.isValid = false;
        overallResult.errors.push(...stepResult.errors);
      }

      // Pass the data from the current step's result to the next step
      // If the step explicitly returns data, use it; otherwise, use the original input for continuity if possible.
      currentData = stepResult.data !== undefined ? stepResult.data : stepResult.data;
    }

    overallResult.data = currentData;
    return overallResult;
  }
}