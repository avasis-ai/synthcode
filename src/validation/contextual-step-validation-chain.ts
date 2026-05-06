import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface StepContext {
  history: Message[];
  currentStepIndex: number;
  totalSteps: number;
}

export interface StepResult {
  success: boolean;
  output: any;
  error?: string;
}

export interface StepValidator {
  validate(context: StepContext, previousResult: StepResult): StepResult;
}

export class ContextualStepValidatorChain {
  private validators: StepValidator[];

  constructor(validators: StepValidator[]) {
    this.validators = validators;
  }

  public validateSequence(initialContext: StepContext, initialPreviousResult: StepResult): { isValid: boolean; failures: { stepIndex: number; error: string }[] } {
    const failures: { stepIndex: number; error: string }[] = [];
    let currentResult: StepResult = initialPreviousResult;

    for (let i = 0; i < this.validators.length; i++) {
      const validator = this.validators[i];
      const context: StepContext = {
        history: initialContext.history,
        currentStepIndex: i,
        totalSteps: this.validators.length,
      };

      try {
        const result = validator.validate(context, currentResult);
        currentResult = result;
      } catch (e) {
        failures.push({
          stepIndex: i,
          error: (e as Error).message || "Unknown validation error",
        });
        // Stop processing on critical failure, or continue based on desired behavior.
        // Here, we record the failure and continue to allow reporting all issues.
      }
    }

    const isValid = failures.length === 0;
    return { isValid, failures };
  }
}