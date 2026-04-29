import { Message } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  data: Record<string, unknown>;
};

type ValidationStep = (input: Record<string, unknown>) => ValidationResult;

export class StructuredToolInputValidationChainBuilder {
  private steps: ValidationStep[] = [];

  private constructor() {}

  private static instance(): StructuredToolInputValidationChainBuilder {
    if (!StructuredToolInputValidationChainBuilder.instance) {
      StructuredToolInputValidationChainBuilder.instance = new StructuredToolInputValidationChainBuilder();
    }
    return StructuredToolInputValidationChainBuilder.instance;
  }

  public static getInstance(): StructuredToolInputValidationChainBuilder {
    return StructuredToolInputValidationChainBuilder.instance();
  }

  public addStep(step: ValidationStep): StructuredToolInputValidationChainBuilder {
    this.steps.push(step);
    return this;
  }

  public build(): (initialInput: Record<string, unknown>) => ValidationResult {
    return (initialInput: Record<string, unknown>): ValidationResult => {
      let currentData: Record<string, unknown> = { ...initialInput };

      for (const step of this.steps) {
        const result = step(currentData);

        if (!result.isValid) {
          return {
            isValid: false,
            errors: [...(result.errors || []), "Validation failed at a previous step."],
            data: currentData,
          };
        }

        currentData = { ...currentData, ...result.data };
      }

      return {
        isValid: true,
        errors: [],
        data: currentData,
      };
    };
  }
}