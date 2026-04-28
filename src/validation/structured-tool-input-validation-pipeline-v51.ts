import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

export interface ValidationStep {
  execute: (context: Record<string, unknown>, input: Record<string, unknown>) => ValidationResult;
}

export class PipelineBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): ValidationStep[] {
    return this.steps;
  }
}

export class StructuredToolInputValidationPipelineV51 {
  private readonly steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  validate(initialInput: Record<string, unknown>): ValidationResult {
    let currentContext: Record<string, unknown> = {};
    let currentInput = { ...initialInput };

    for (const step of this.steps) {
      const result = step.execute(currentContext, currentInput);
      if (!result.isValid) {
        return {
          isValid: false,
          errors: [...(currentContext as any).errors || [], ...result.errors],
          context: { ...currentContext, errors: result.errors },
        };
      }
      currentContext = { ...currentContext, ...result.context };
    }

    return {
      isValid: true,
      errors: [],
      context: currentContext,
    };
  }
}