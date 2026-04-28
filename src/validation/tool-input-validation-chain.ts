import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface ValidationStep {
  validate(context: any): { isValid: boolean; error?: string };
}

export class ToolInputValidationChain {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  validate(input: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step.validate(input);
      if (!result.isValid) {
        errors.push(result.error || "Validation failed for an unknown reason.");
        overallValid = false;
        // Depending on requirements, we might break here (fail fast)
        // or continue to collect all errors. We continue here.
      }
    }

    return {
      isValid: overallValid,
      errors: errors,
    };
  }
}