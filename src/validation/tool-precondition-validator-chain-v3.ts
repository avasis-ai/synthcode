import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface AsyncPreconditionValidator<TContext> {
  validate: (context: TContext) => Promise<void>;
}

export class ToolPreconditionValidatorChainV3<TContext> {
  private validators: AsyncPreconditionValidator<TContext>[] = [];

  addValidator(validator: AsyncPreconditionValidator<TContext>): void {
    this.validators.push(validator);
  }

  async validateAll(context: TContext): Promise<void> {
    for (const validator of this.validators) {
      try {
        await validator.validate(context);
      } catch (error) {
        throw new Error(`Precondition validation failed: ${(error as Error).message}`);
      }
    }
  }
}