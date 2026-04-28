import { Message } from "./message";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationStep {
  validate(output: Record<string, unknown>): ValidationResult;
}

export interface ValidationChainExecutor {
  execute(output: Record<string, unknown>): ValidationResult;
}

class ToolOutputValidationChainBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): ValidationChainExecutor {
    return {
      execute: (output: Record<string, unknown>): ValidationResult => {
        let accumulatedErrors: string[] = [];
        let currentOutput: Record<string, unknown> = { ...output };

        for (const step of this.steps) {
          const result = step.validate(currentOutput);
          if (!result.isValid) {
            accumulatedErrors.push(...result.errors);
          }
          // In a real-world scenario, subsequent steps might need to process the output
          // based on the failure of the previous step. For simplicity here, we pass
          // the original output to all steps, but we track errors.
        }

        return {
          isValid: accumulatedErrors.length === 0,
          errors: accumulatedErrors,
        };
      },
    };
  }
}

export { ToolOutputValidationChainBuilder };