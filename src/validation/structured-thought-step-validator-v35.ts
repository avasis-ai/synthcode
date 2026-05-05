import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ThoughtStep {
  id: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  context: Record<string, unknown>;
}

export interface CrossStepValidator {
  validate(
    previousStep: ThoughtStep,
    currentStep: ThoughtStep
  ): { isValid: boolean; message: string };
}

export interface ValidatorBuilder {
  addCrossStepValidator(validator: CrossStepValidator): ValidatorBuilder;
  build(): StructuredThoughtStepValidator;
}

export class StructuredThoughtStepValidator {
  private crossValidators: CrossStepValidator[] = [];

  private constructor(validators: CrossStepValidator[]) {
    this.crossValidators = validators;
  }

  public static createBuilder(): ValidatorBuilder {
    return {
      addCrossStepValidator: (validator) => {
        const builder = new StructuredThoughtStepValidatorBuilder();
        builder.addCrossStepValidator(validator);
        return builder;
      },
      build: () => new StructuredThoughtStepValidator(
        []
      )
    };
  }

  private static buildValidator(validators: CrossStepValidator[]): StructuredThoughtStepValidator {
    return new StructuredThoughtStepValidator(validators);
  }

  public validateSequence(
    steps: ThoughtStep[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    for (let i = 1; i < steps.length; i++) {
      const previousStep = steps[i - 1];
      const currentStep = steps[i];

      for (const validator of this.crossValidators) {
        const result = validator.validate(previousStep, currentStep);
        if (!result.isValid) {
          errors.push(`Cross-step validation failed between Step ${i - 1} and Step ${i}: ${result.message}`);
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }
}

class StructuredThoughtStepValidatorBuilder implements ValidatorBuilder {
  private validators: CrossStepValidator[] = [];

  addCrossStepValidator(validator: CrossStepValidator): ValidatorBuilder {
    this.validators.push(validator);
    return this;
  }

  build(): StructuredThoughtStepValidator {
    return StructuredThoughtStepValidator.buildValidator(this.validators);
  }
}