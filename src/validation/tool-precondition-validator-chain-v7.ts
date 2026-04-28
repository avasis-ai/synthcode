import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface PreconditionValidator {
  validate(context: { messages: Message[] }, inputs: Record<string, unknown>): Promise<{ isValid: boolean; errors: string[] }>;
}

export class ToolPreconditionValidatorChainV7 {
  private validators: PreconditionValidator[];

  constructor(validators: PreconditionValidator[] = []) {
    this.validators = validators;
  }

  public addValidator(validator: PreconditionValidator): void {
    this.validators.push(validator);
  }

  public async validate(context: { messages: Message[] }, inputs: Record<string, unknown>): Promise<{ isValid: boolean; errors: string[]; failedValidator: string | null }> {
    let allErrors: string[] = [];
    let failedValidator: string | null = null;

    for (const validator of this.validators) {
      try {
        const result = await validator.validate(context, inputs);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          failedValidator = "Unknown"; // In a real scenario, we'd track the validator name
          break; // Short-circuit on first failure
        }
      } catch (e) {
        allErrors.push(`Validator execution failed: ${(e as Error).message}`);
        failedValidator = "Unknown";
        break; // Short-circuit on error
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      failedValidator: failedValidator,
    };
  }
}