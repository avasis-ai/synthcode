import { Message } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context?: Record<string, unknown>;
};

export interface AdvancedPreconditionStep {
  execute: (context: Record<string, unknown>, messageHistory: Message[]): Promise<ValidationResult>;
}

export class ToolPreconditionValidatorChain {
  private steps: AdvancedPreconditionStep[];

  constructor(steps: AdvancedPreconditionStep[]) {
    this.steps = steps;
  }

  public async validate(context: Record<string, unknown>, messageHistory: Message[]): Promise<ValidationResult> {
    let accumulatedErrors: string[] = [];
    let currentContext: Record<string, unknown> = { ...context };

    for (const step of this.steps) {
      try {
        const result = await step.execute(currentContext, messageHistory);
        if (!result.isValid) {
          accumulatedErrors = accumulatedErrors.concat(result.errors);
          // Decide on early exit logic. For complex validation, we might want to collect all errors.
          // For this implementation, we continue to collect all errors from all steps.
        } else if (result.context) {
          currentContext = { ...currentContext, ...result.context };
        }
      } catch (error) {
        accumulatedErrors.push(`Step execution failed: ${error instanceof Error ? error.message : String(error)}`);
        // If a step throws, we treat it as a critical failure for the chain.
      }
    }

    const finalResult: ValidationResult = {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      context: currentContext,
    };

    return finalResult;
  }
}

export class ToolPreconditionValidatorChainBuilder {
  private steps: AdvancedPreconditionStep[] = [];

  addStep(step: AdvancedPreconditionStep): this {
    this.steps.push(step);
    return this;
  }

  build(): ToolPreconditionValidatorChain {
    return new ToolPreconditionValidatorChain(this.steps);
  }
}