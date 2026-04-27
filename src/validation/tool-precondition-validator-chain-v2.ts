import { Message, ToolUseBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type AsyncValidator = (context: {
  messages: Message[];
  toolUse: ToolUseBlock;
}) => Promise<ValidationResult>;

export type SyncValidator = (context: {
  messages: Message[];
  toolUse: ToolUseBlock;
}) => ValidationResult;

export interface ValidatorChain {
  validators: {
    async: AsyncValidator[];
    sync: SyncValidator[];
  };
}

export class ToolPreconditionValidatorChainV2 {
  private readonly validators: ValidatorChain;

  constructor(validators: ValidatorChain) {
    this.validators = validators;
  }

  private async runAsyncValidators(context: {
    messages: Message[];
    toolUse: ToolUseBlock;
  }): Promise<ValidationResult> {
    for (const validator of this.validators.validators.async) {
      const result = await validator(context);
      if (!result.isValid) {
        return {
          isValid: false,
          errors: [...(result as any).errors, "Async validation failed"],
        };
      }
    }
    return { isValid: true, errors: [] };
  }

  private runSyncValidators(context: {
    messages: Message[];
    toolUse: ToolUseBlock;
  }): ValidationResult {
    const errors: string[] = [];
    for (const validator of this.validators.validators.sync) {
      const result = validator(context);
      if (!result.isValid) {
        errors.push(...(result as any).errors);
      }
    }
    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  public async validate(context: {
    messages: Message[];
    toolUse: ToolUseBlock;
  }): Promise<ValidationResult> {
    const asyncResult = await this.runAsyncValidators(context);
    if (!asyncResult.isValid) {
      return {
        isValid: false,
        errors: [...(asyncResult as any).errors, "Validation failed during async checks"],
      };
    }

    const syncResult = this.runSyncValidators(context);
    if (!syncResult.isValid) {
      return {
        isValid: false,
        errors: [...(syncResult as any).errors, "Validation failed during sync checks"],
      };
    }

    return { isValid: true, errors: [] };
  }
}