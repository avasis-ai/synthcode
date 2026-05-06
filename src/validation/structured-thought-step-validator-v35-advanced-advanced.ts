import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationContext = {
  history: Message[];
  currentState: Record<string, unknown>;
};

export type StepResult = {
  isValid: boolean;
  errors: string[];
  updatedContext: Record<string, unknown>;
};

export interface StepValidator {
  validate(
    stepInput: {
      stepIndex: number;
      data: Record<string, unknown>;
    },
    context: ValidationContext
  ): StepResult;
}

export interface StepValidatorBuilder {
  withStepValidator(validator: StepValidator): StepValidatorBuilder;
  build(): StructuredThoughtStepValidator;
}

export class StructuredThoughtStepValidator {
  private validators: StepValidator[] = [];

  private constructor(validators: StepValidator[]) {
    this.validators = validators;
  }

  public static createBuilder(): StepValidatorBuilder {
    return {
      withStepValidator: (validator) => {
        const builder = new StructuredThoughtStepValidatorBuilder();
        builder.withStepValidator(validator);
        return builder;
      },
      build: () => new StructuredThoughtStepValidatorBuilder().withStepValidator(new StepValidatorPlaceholder()).build(), // Placeholder for type matching
    } as unknown as StepValidatorBuilder; // Type assertion to satisfy the required structure

  }

  public validateSteps(
    stepsData: {
      stepIndex: number;
      data: Record<string, unknown>;
    }[],
    initialContext: ValidationContext
  ): {
    isValid: boolean;
    errors: string[];
    finalContext: Record<string, unknown>;
  } {
    let currentContext: ValidationContext = {
      history: [...initialContext.history],
      currentState: { ...initialContext.currentState },
    };

    let allErrors: string[] = [];
    let isValid = true;

    for (const stepData of stepsData) {
      let stepResult: StepResult = {
        isValid: true,
        errors: [],
        updatedContext: { ...currentContext.currentState },
      };

      for (const validator of this.validators) {
        stepResult = validator.validate(stepData, currentContext);
        if (!stepResult.isValid) {
          isValid = false;
          allErrors.push(...stepResult.errors);
          break;
        }
      }

      if (stepResult.isValid) {
        currentContext = {
          history: [...currentContext.history], // Simplified history update for this scope
          currentState: stepResult.updatedContext,
        };
      } else {
        // Stop processing on first failure for strict validation
        break;
      }
    }

    return {
      isValid,
      errors: allErrors,
      finalContext: currentContext.currentState,
    };
  }
}

class StructuredThoughtStepValidatorBuilder implements StepValidatorBuilder {
  private validators: StepValidator[] = [];

  public withStepValidator(validator: StepValidator): StepValidatorBuilder {
    this.validators.push(validator);
    return this;
  }

  public build(): StructuredThoughtStepValidator {
    return new StructuredThoughtStepValidator(this.validators);
  }
}

class StepValidatorPlaceholder implements StepValidator {
  validate(
    stepInput: {
      stepIndex: number;
      data: Record<string, unknown>;
    },
    context: ValidationContext
  ): StepResult {
    return {
      isValid: true,
      errors: [],
      updatedContext: context.currentState,
    };
  }
}

export const createStructuredThoughtStepValidator = (): StepValidatorBuilder => {
  return StructuredThoughtStepValidator.createBuilder();
};