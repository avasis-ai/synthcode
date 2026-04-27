import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationContext {
  messages: Message[];
  toolInputs: Record<string, unknown>;
  currentState: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  context?: Record<string, any>;
}

export interface PreconditionValidator {
  validate(context: ValidationContext): Promise<ValidationResult>;
}

export class ToolPreconditionValidatorChainV6 {
  private validators: PreconditionValidator[];

  constructor(validators: PreconditionValidator[] = []) {
    this.validators = validators;
  }

  addValidator(validator: PreconditionValidator): this {
    this.validators.push(validator);
    return this;
  }

  async validate(context: ValidationContext): Promise<ValidationResult> {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const validator of this.validators) {
      try {
        const result = await validator.validate(context);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          overallValid = false;
        }
      } catch (error) {
        allErrors.push(`Validator execution failed: ${error instanceof Error ? error.message : String(error)}`);
        overallValid = false;
      }
    }

    const finalResult: ValidationResult = {
      isValid: overallValid,
      errors: allErrors,
    };

    return finalResult;
  }
}