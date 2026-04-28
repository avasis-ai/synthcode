import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context?: Record<string, any>;
}

export interface ValidationStep {
  validate(input: any, context: any): ValidationResult;
}

export class StructuredToolInputValidationPipelineV19 {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public run(input: any, context: any): ValidationResult {
    let allErrors: string[] = [];
    let currentContext: Record<string, any> = { ...context };

    for (const step of this.steps) {
      const result = step.validate(input, currentContext);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
      // Optionally, update context with step-specific results if needed for subsequent steps
      if (result.context) {
        currentContext = { ...currentContext, ...result.context };
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      context: currentContext,
    };
  }
}