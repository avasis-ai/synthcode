import { Context } from "../context";

export interface Validator {
  validate(context: Context): { isValid: boolean; message?: string };
}

export interface ValidatorFactory {
  (context: Context): Validator;
}

export class ToolPreconditionChain {
  private validators: Validator[];

  constructor(validators: Validator[]) {
    this.validators = validators;
  }

  execute(context: Context): { isValid: boolean; failureMessage?: string } {
    for (const validator of this.validators) {
      const result = validator.validate(context);
      if (!result.isValid) {
        return { isValid: false, failureMessage: result.message };
      }
    }
    return { isValid: true };
  }
}

export class ToolPreconditionChainBuilder {
  private toolId: string;
  private validators: Validator[] = [];

  constructor(toolId: string) {
    this.toolId = toolId;
  }

  addValidator(validator: Validator): this {
    this.validators.push(validator);
    return this;
  }

  addValidator(validatorFactory: ValidatorFactory): this {
    const validator = validatorFactory(new Context()); // Context is mocked/simplified here for factory usage
    this.validators.push(validator);
    return this;
  }

  build(): ToolPreconditionChain {
    return new ToolPreconditionChain(this.validators);
  }
}