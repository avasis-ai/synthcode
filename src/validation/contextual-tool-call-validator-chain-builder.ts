import { Message } from "./types";

type ValidatorFunction = (toolCall: { name: string; input: Record<string, unknown> }) => {
  isValid: boolean;
  error?: string;
};

export class ContextualToolCallValidatorChainBuilder {
  private validators: ValidatorFunction[] = [];

  public addValidator(validator: ValidatorFunction): this {
    this.validators.push(validator);
    return this;
  }

  public build(): (toolCall: { name: string; input: Record<string, unknown> }) => {
    return (toolCall: { name: string; input: Record<string, unknown> }): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      let allValid = true;

      for (const validator of this.validators) {
        const result = validator(toolCall);
        if (!result.isValid) {
          allValid = false;
          if (result.error) {
            errors.push(result.error);
          }
        }
      }

      return {
        isValid: allValid,
        errors: errors,
      };
    };
  }
}