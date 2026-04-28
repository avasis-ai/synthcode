import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationContext {
  input: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationStep {
  validate(context: ValidationContext): ValidationResult;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  context: ValidationContext;
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(context: ValidationContext): ValidationReport {
    let allErrors: string[] = [];
    let overallValid = true;
    let currentContext: ValidationContext = { ...context };

    for (const step of this.steps) {
      const result = step.validate(currentContext);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
      context: currentContext,
    };
  }
}