import { Message } from "./message";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

export interface ValidationStep {
  execute: (partialOutput: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

export class StructuredOutputValidationChain {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  static create(): StructuredOutputValidationChain {
    return new StructuredOutputValidationChain();
  }

  validate(output: Record<string, unknown>): ValidationResult {
    let currentContext: Record<string, unknown> = {};
    let lastResult: ValidationResult = {
      isValid: true,
      errors: [],
      context: { ...currentContext },
    };

    for (const step of this.steps) {
      const result = step.execute(output, { ...currentContext, ...lastResult.context });

      if (!result.isValid) {
        lastResult.errors.push(...result.errors);
        lastResult.isValid = false;
      }

      // Merge context: new step's context overrides previous ones, but we keep all accumulated data
      lastResult.context = {
        ...lastResult.context,
        ...result.context,
      };
    }

    return {
      isValid: lastResult.isValid,
      errors: lastResult.errors,
      context: lastResult.context,
    };
  }

  /**
   * Factory method for creating a CrossFieldValidator step.
   * Validates dependencies between fields in the output object.
   */
  static crossFieldValidator(
    dependencies: {
      field: keyof Record<string, unknown>;
      validator: (value1: unknown, value2: unknown) => string | null;
    }[]
  ): ValidationStep {
    return {
      execute: (partialOutput, context) => {
        const errors: string[] = [];
        for (const { field, validator } of dependencies) {
          const value1 = partialOutput[field];
          // For simplicity, we assume the second value is available in the context for cross-field checks
          // In a real scenario, the dependency structure would need to be more explicit.
          const value2 = context.someOtherField || null;

          if (value1 !== undefined && value2 !== undefined) {
            const error = validator(value1, value2);
            if (error) {
              errors.push(`Cross-field validation failed for ${field}: ${error}`);
            }
          }
        }
        return {
          isValid: errors.length === 0,
          errors: errors,
          context: { crossFieldValidated: true },
        };
      },
    };
  }

  /**
   * Factory method for creating a TemporalValidator step.
   * Validates sequences or time-based constraints (conceptual implementation).
   */
  static temporalValidator(
    requiredSequence: string[]
  ): ValidationStep {
    return {
      execute: (partialOutput, context) => {
        // Placeholder logic: checks if all required sequence elements are present in the context
        const missing = requiredSequence.filter(
          (item) => !(item in context)
        );

        if (missing.length > 0) {
          return {
            isValid: false,
            errors: [`Temporal constraint failed: Missing required sequence elements: ${missing.join(', ')}`],
            context: { temporalCheckPassed: false },
          };
        }

        return {
          isValid: true,
          errors: [],
          context: { temporalCheckPassed: true },
        };
      },
    };
  }
}