import { Validator, Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./base-validator";

export class StructuredThoughtStepValidatorV24 implements Validator {
  private readonly stepTypeValidator: (step: Message) => boolean;
  private readonly contextValidator: (context: { history: Message[] }) => boolean;

  constructor(stepTypeValidator: (step: Message) => boolean, contextValidator: (context: { history: Message[] }) => boolean) {
    this.stepTypeValidator = stepTypeValidator;
    this.contextValidator = contextValidator;
  }

  validate(step: Message, context: { history: Message[] }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.stepTypeValidator(step)) {
      errors.push("Step type validation failed: The provided step does not match the expected structure or type.");
    }

    if (!this.contextValidator(context)) {
      errors.push("Context validation failed: The step does not maintain structural consistency with the preceding history.");
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }
}