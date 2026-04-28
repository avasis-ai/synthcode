import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationStep {
  validate(context: Record<string, unknown>, input: any): ValidationResult;
}

export class StructuredToolInputValidationPipelineV25 {
  private steps: ValidationStep[];
  private initialContext: Record<string, unknown>;

  constructor(steps: ValidationStep[], initialContext: Record<string, unknown>) {
    this.steps = steps;
    this.initialContext = initialContext;
  }

  private getContext(stepIndex: number): Record<string, unknown> {
    // In a real-world scenario, context might be updated by previous steps.
    // For this implementation, we pass the initial context, but allow steps to read from it.
    return { ...this.initialContext };
  }

  public run(input: any): ValidationResult {
    let currentContext: Record<string, unknown> = { ...this.initialContext };
    let accumulatedErrors: string[] = [];
    let overallIsValid = true;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const stepContext = this.getContext(i);
      
      const result = step.validate(stepContext, input);

      if (!result.isValid) {
        overallIsValid = false;
        accumulatedErrors = [...accumulatedErrors, ...result.errors];
      }
      
      // Optionally, update context based on step result if the step provided context updates
      // For simplicity, we assume context remains stable or is updated externally if needed.
    }

    return {
      isValid: overallIsValid,
      errors: accumulatedErrors,
    };
  }
}