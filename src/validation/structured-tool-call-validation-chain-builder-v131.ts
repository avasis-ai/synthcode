import { Message, ContentBlock, ToolUseBlock } from "./types";

type Validator<T> = (input: T) => { isValid: boolean; error?: string };

interface SchemaValidator<T> {
  validate: (data: T) => { isValid: boolean; error?: string };
}

interface PreconditionValidator<T> {
  validate: (context: { history: Message[]; toolCall: ToolUseBlock }) => { isValid: boolean; error?: string };
}

interface CapabilityValidator<T> {
  validate: (context: { history: Message[]; toolCall: ToolUseBlock }) => { isValid: boolean; error?: string };
}

type ValidationChain<T> = {
  run: (input: T, context: { history: Message[]; toolCall: ToolUseBlock }) => {
    isValid: boolean;
    error?: string;
    result?: any;
  };
};

export class StructuredToolCallValidationChainBuilder {
  private validators: {
    schema?: SchemaValidator<any>;
    precondition?: PreconditionValidator<any>;
    capability?: CapabilityValidator<any>;
  } = {};

  private constructor() {}

  public static getInstance(): StructuredToolCallValidationChainBuilder {
    if (!StructuredToolCallValidationChainBuilder.instance) {
      StructuredToolCallValidationChainBuilder.instance = new StructuredToolCallValidationChainBuilder();
    }
    return StructuredToolCallValidationChainBuilder.instance;
  }

  public addSchemaValidator(validator: SchemaValidator<any>): StructuredToolCallValidationChainBuilder {
    this.validators.schema = validator;
    return this;
  }

  public addPreconditionValidator(validator: PreconditionValidator<any>): StructuredToolCallValidationChainBuilder {
    this.validators.precondition = validator;
    return this;
  }

  public addCapabilityValidator(validator: CapabilityValidator<any>): StructuredToolCallValidationChainBuilder {
    this.validators.capability = validator;
    return this;
  }

  public build<T>(): ValidationChain<T> {
    return {
      run: (input: T, context: { history: Message[]; toolCall: ToolUseBlock }): {
        isValid: boolean;
        error?: string;
        result?: any;
      } => {
        let currentInput: T = input;

        if (this.validators.schema) {
          const schemaResult = this.validators.schema.validate(input);
          if (!schemaResult.isValid) {
            return { isValid: false, error: `Schema validation failed: ${schemaResult.error}` };
          }
        }

        if (this.validators.precondition) {
          const precondResult = this.validators.precondition.validate(context);
          if (!precondResult.isValid) {
            return { isValid: false, error: `Precondition validation failed: ${precondResult.error}` };
          }
        }

        if (this.validators.capability) {
          const capResult = this.validators.capability.validate(context);
          if (!capResult.isValid) {
            return { isValid: false, error: `Capability validation failed: ${capResult.error}` };
          }
        }

        return { isValid: true, result: { message: "Validation successful" } };
      },
    };
  }

  private static instance: StructuredToolCallValidationChainBuilder;
}