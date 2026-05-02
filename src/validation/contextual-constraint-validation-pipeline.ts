import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface Context {
  data: Record<string, unknown>;
  history: Message[];
}

export interface ConstraintValidator {
  validate(context: Context): {
    result: ValidationResult;
    newContext: Context;
  };
}

export class ConstraintPipeline {
  private validators: ConstraintValidator[];
  private initialContext: Context;

  constructor(validators: ConstraintValidator[], initialContext: Context) {
    this.validators = validators;
    this.initialContext = initialContext;
  }

  run(
    context: Context = this.initialContext,
    failFast: boolean = true
  ): {
    finalContext: Context;
    results: ValidationResult[];
    success: boolean;
  } {
    let currentContext: Context = context;
    const results: ValidationResult[] = [];
    let success = true;

    for (const validator of this.validators) {
      const { result, newContext } = validator.validate(currentContext);
      results.push(result);

      if (!result.isValid) {
        success = false;
        if (failFast) {
          break;
        }
      }
      currentContext = newContext;
    }

    return {
      finalContext: currentContext,
      results: results,
      success: success,
    };
  }
}