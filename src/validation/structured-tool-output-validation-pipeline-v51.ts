import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface StructuredToolOutputValidationStep {
  name: string;
  validate(output: Record<string, unknown>, context: Record<string, unknown>): { isValid: boolean; errors: string[]; resolvedOutput?: Record<string, unknown> };
}

export class StructuredToolOutputValidationPipeline {
  private steps: StructuredToolOutputValidationStep[];

  constructor(steps: StructuredToolOutputValidationStep[]) {
    this.steps = steps;
  }

  public validate(output: Record<string, unknown>, initialContext: Record<string, unknown>): { isValid: boolean; errors: string[]; finalOutput: Record<string, unknown> } {
    let currentOutput: Record<string, unknown> = { ...output };
    let currentContext: Record<string, unknown> = { ...initialContext };
    let allErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.validate(currentOutput, currentContext);

      if (!result.isValid) {
        allErrors.push(...result.errors);
        // Decide whether to halt or continue based on step failure severity.
        // For now, we accumulate errors but use the potentially resolved output if provided.
      }

      if (result.resolvedOutput !== undefined) {
        currentOutput = result.resolvedOutput;
      }
      // Context update logic can be expanded here if steps modify context.
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      finalOutput: currentOutput,
    };
  }
}

export const createValidationPipeline = (steps: StructuredToolOutputValidationStep[]): StructuredToolOutputValidationPipeline => {
  return new StructuredToolOutputValidationPipeline(steps);
};