import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  contextUpdates: Record<string, unknown>;
}

export interface PreconditionValidator {
  validate(context: Record<string, unknown>): ValidationResult;
}

export class ToolPreconditionValidatorChainV4 {
  private validators: PreconditionValidator[];

  constructor(validators: PreconditionValidator[]) {
    this.validators = validators;
  }

  public validate(context: Record<string, unknown>): ValidationResult {
    let accumulatedContext: Record<string, unknown> = { ...context };
    let allErrors: string[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(accumulatedContext);

      if (!result.isValid) {
        allErrors.push(...result.errors);
        return {
          isValid: false,
          errors: allErrors,
          contextUpdates: accumulatedContext,
        };
      }

      // Aggregate successful context updates
      Object.assign(accumulatedContext, result.contextUpdates);
    }

    return {
      isValid: true,
      errors: [],
      contextUpdates: accumulatedContext,
    };
  }
}