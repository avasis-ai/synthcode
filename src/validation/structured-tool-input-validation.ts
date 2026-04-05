import {
  ToolInvocationContext,
  ValidationResult,
} from "./types";

interface ContextualValidator<T> {
  validate(
    context: ToolInvocationContext,
    input: T
  ): ValidationResult;
}

class ContextualValidatorChain<T> {
  private validators: ContextualValidator<T>[] = [];

  addValidator(validator: ContextualValidator<T>): this {
    this.validators.push(validator);
    return this;
  }

  validate(context: ToolInvocationContext, input: T): ValidationResult {
    for (const validator of this.validators) {
      const result = validator.validate(context, input);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true, errors: [] };
  }
}

export class ToolCallValidator {
  private validatorChain: ContextualValidatorChain<Record<string, unknown>>;

  constructor() {
    this.validatorChain = new ContextualValidatorChain<Record<string, unknown>>();
  }

  addContextualValidator(validator: ContextualValidator<Record<string, unknown>>): void {
    this.validatorChain.addValidator(validator);
  }

  validateToolInput(
    context: ToolInvocationContext,
    input: Record<string, unknown>
  ): ValidationResult {
    return this.validatorChain.validate(context, input);
  }
}