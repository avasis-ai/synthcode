import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

export interface ValidationStep {
  execute: (context: Record<string, unknown>, input: unknown) => ValidationResult;
}

export class StructuredToolInputValidationPipelineV34 {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public run(initialInput: unknown): ValidationResult {
    let currentContext: Record<string, unknown> = {};
    let accumulatedErrors: string[] = [];
    let lastResult: ValidationResult = {
      isValid: true,
      errors: [],
      context: { initialInput: initialInput },
    };

    for (const step of this.steps) {
      const result = step.execute(lastResult.context, initialInput);

      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
        // Stop immediately on failure as per requirement, but we still update context
        // to potentially capture partial state if needed, though the return will reflect failure.
        lastResult = result;
        break;
      }

      // Update context and last result for the next step
      lastResult = result;
      currentContext = { ...lastResult.context, ...result.context };
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      context: currentContext,
    };
  }
}