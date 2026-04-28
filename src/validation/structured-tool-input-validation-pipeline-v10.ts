import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context: any;
}

export interface ValidationStep {
  validate(context: any): { isValid: boolean; errors: string[] };
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public run(input: any): ValidationResult {
    let currentContext: any = { input: input };
    let accumulatedErrors: string[] = [];
    let overallIsValid: boolean = true;

    for (const step of this.steps) {
      const result = step.validate(currentContext);

      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
        overallIsValid = false;
        // In a real-world scenario, we might decide to continue or break based on step criticality.
        // For this implementation, we accumulate errors but continue to run subsequent steps
        // unless the step explicitly signals a critical failure (which we model by just logging the error).
      }

      // Update context with any derived state from the step, if necessary.
      // For simplicity here, we assume the context update is handled within the step's logic
      // or that the step only reads from the input.
      currentContext = { ...currentContext, stepContext: result.context || currentContext };
    }

    return {
      isValid: overallIsValid,
      errors: accumulatedErrors,
      context: currentContext,
    };
  }
}