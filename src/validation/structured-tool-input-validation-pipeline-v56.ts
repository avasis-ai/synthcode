import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

type ValidationContext = {
  input: Record<string, unknown>;
  messages: Message[];
  contextData: Record<string, unknown>;
};

export interface ValidationStep {
  execute: (context: ValidationContext) => ValidationResult;
}

class PipelineBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): ValidationStep[] {
    return this.steps;
  }
}

export class StructuredToolInputValidationPipelineV56 implements ValidationStep {
  private readonly steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  execute(context: ValidationContext): ValidationResult {
    let currentContext: ValidationContext = {
      input: context.input,
      messages: context.messages,
      contextData: context.contextData,
    };

    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step.execute(currentContext);

      if (!result.isValid) {
        allErrors.push(...result.errors);
        overallValid = false;
      } else {
        // Update context with successful step's output if necessary
        currentContext.contextData = {
          ...currentContext.contextData,
          ...result.context,
        };
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
      context: currentContext.contextData,
    };
  }

  static build(steps: ValidationStep[]): StructuredToolInputValidationPipelineV56 {
    return new StructuredToolInputValidationPipelineV56(steps);
  }
}