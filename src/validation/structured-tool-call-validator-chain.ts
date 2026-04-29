import { ToolCall, ValidationResult } from "./tool-call-validator.js";

export class ToolCallValidatorChain {
  private validators: ToolCallValidator[];

  constructor(validators: ToolCallValidator[]) {
    this.validators = validators;
  }

  static create(validators: ToolCallValidator[]): ToolCallValidatorChain {
    return new ToolCallValidatorChain(validators);
  }

  public validate(toolCalls: ToolCall[]): ValidationResult {
    let currentResult: ValidationResult = {
      isValid: true,
      errors: []
    };

    for (const validator of this.validators) {
      const validationResult = validator.validate(toolCalls, currentResult);
      currentResult = {
        isValid: currentResult.isValid && validationResult.isValid,
        errors: [...currentResult.errors, ...(validationResult.errors || [])]
      };
    }

    return currentResult;
  }

  public static mustCallAThenB(
    validatorA: ToolCallValidator,
    validatorB: ToolCallValidator
  ): ToolCallValidatorChain {
    return ToolCallValidatorChain.create([validatorA, validatorB]);
  }
}