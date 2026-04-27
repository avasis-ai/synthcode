import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationStep {
  execute(input: any, context: any): { isValid: boolean; error?: string; result?: any };
}

export class ToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(input: any, context: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let currentResult: any = input;

    for (const step of this.steps) {
      const validationResult = step.execute(currentResult, context);

      if (!validationResult.isValid) {
        errors.push(validationResult.error || "Validation failed at an unknown step.");
        // Stop processing on first failure as per requirement to collect errors sequentially
        // but for this implementation, we stop and collect all errors encountered.
        // If we wanted to continue processing with partial data, we would update currentResult.
        // For strict sequential validation, we break.
        break;
      }

      // Update the result for the next step to use
      currentResult = validationResult.result ?? currentResult;
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}