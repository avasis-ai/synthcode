import { Message } from "./types";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

interface ValidationStep {
  validate: (data: any) => ValidationResult;
}

interface FallbackStep {
  execute: (data: any, errors: string[]): ValidationResult;
}

export class StructuredOutputValidationChainBuilder {
  private steps: ValidationStep[] = [];
  private fallbackStep: FallbackStep | null = null;

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  addFallback(fallbackStep: FallbackStep): this {
    this.fallbackStep = fallbackStep;
    return this;
  }

  build(): {
    run: (data: any): ValidationResult;
  } {
    const steps = this.steps;
    const fallback = this.fallbackStep;

    const runChain = (data: any): ValidationResult => {
      let currentData: any = data;
      let accumulatedErrors: string[] = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const result = step.validate(currentData);

        if (!result.isValid) {
          accumulatedErrors = [...accumulatedErrors, ...result.errors];
          // In a real scenario, we might stop or pass partial data.
          // For simplicity, we'll just collect errors and let the next step run on the original data
          // or the last successful data if we were to implement state passing more strictly.
          // Here, we'll just record the failure and continue to collect all errors.
        } else {
          currentData = result.data || currentData;
        }
      }

      if (accumulatedErrors.length > 0 && fallback) {
        return fallback.execute(data, accumulatedErrors);
      }

      const finalResult: ValidationResult = {
        isValid: accumulatedErrors.length === 0,
        errors: accumulatedErrors,
        data: currentData,
      };
      return finalResult;
    };

    return { run: runChain };
  }
}