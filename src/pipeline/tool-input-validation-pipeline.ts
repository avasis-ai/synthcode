import { ToolCall } from "./tool-call.js";

export type ValidationError = {
  stepName: string;
  message: string;
  details?: any;
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export type ValidationStep = (inputs: Record<string, unknown>) => {
  isValid: boolean;
  errors: ValidationError[];
};

export class ToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  private validate(inputs: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    for (const step of this.steps) {
      const result = step(inputs);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  public validateToolCallChain(toolCalls: ToolCall[]): ValidationResult {
    const inputs: Record<string, unknown> = {
      toolCalls: toolCalls,
    };
    return this.validate(inputs);
  }
}

export const createToolInputValidationPipeline = (
  steps: ValidationStep[]
): ToolInputValidationPipeline => {
  return new ToolInputValidationPipeline(steps);
};