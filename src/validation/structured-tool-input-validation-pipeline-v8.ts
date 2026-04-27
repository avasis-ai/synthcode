import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  output: any;
  errors: string[];
}

export interface ValidationStep {
  execute: (input: any) => Promise<{ output: any; errors: string[] }>;
}

export class StructuredToolInputValidationPipelineV8 {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): void {
    this.steps.push(step);
  }

  async validate(input: any): Promise<ValidationResult> {
    let currentInput: any = input;
    let aggregatedErrors: string[] = [];
    let finalOutput: any = input;

    for (const step of this.steps) {
      try {
        const result = await step.execute(currentInput);
        finalOutput = result.output;
        if (result.errors.length > 0) {
          aggregatedErrors.push(...result.errors);
        }
        currentInput = result.output;
      } catch (error) {
        aggregatedErrors.push(`Pipeline step failed: ${error instanceof Error ? error.message : String(error)}`);
        // Stop processing on critical failure, but return what we have
        break;
      }
    }

    const isValid = aggregatedErrors.length === 0;

    return {
      isValid: isValid,
      output: finalOutput,
      errors: aggregatedErrors,
    };
  }
}