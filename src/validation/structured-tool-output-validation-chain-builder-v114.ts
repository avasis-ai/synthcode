import { Message } from "./types";

interface ValidatorStep {
  validate: (output: any) => { isValid: boolean; error?: any };
  onFailure?: (error: any) => any;
}

interface FailureCondition {
  onFailure?: (error: any) => any;
}

class ValidatorChainExecutor {
  private steps: { step: ValidatorStep; failureCondition: FailureCondition }[];

  constructor(steps: { step: ValidatorStep; failureCondition: FailureCondition }[]) {
    this.steps = steps;
  }

  execute(output: any): { success: boolean; finalError?: any } {
    for (const { step, failureCondition } of this.steps) {
      const validationResult = step.validate(output);

      if (!validationResult.isValid) {
        try {
          if (failureCondition?.onFailure) {
            const failureAction = failureCondition.onFailure(validationResult.error);
            if (failureAction instanceof Error) {
              throw failureAction;
            }
            // Assuming failureAction can be thrown or handled, for simplicity, we throw if it's not null/undefined
            if (failureAction) {
                throw failureAction;
            }
          }
          return { success: false, finalError: validationResult.error };
        } catch (e) {
          return { success: false, finalError: e };
        }
      }
    }
    return { success: true };
  }
}

export class StructuredToolOutputValidationChainBuilder {
  private steps: { step: ValidatorStep; failureCondition: FailureCondition }[] = [];

  addStep(validator: ValidatorStep, failureCondition: FailureCondition = {}): this {
    this.steps.push({ step: validator, failureCondition });
    return this;
  }

  build(): ValidatorChainExecutor {
    return new ValidatorChainExecutor(this.steps);
  }
}