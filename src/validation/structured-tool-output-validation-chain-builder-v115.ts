import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface Validator<T> {
  validate(input: T): { isValid: boolean; errors: string[] };
}

interface Transformer<T, R> {
  transform(input: T): R;
}

type ValidationChainExecutor = {
  execute: <T>(input: T): { result: any; errors: string[] };
};

class ValidationChainBuilder<T> {
  private validators: { validator: Validator<T>; name: string }[] = [];
  private transformers: { transformer: <T, R>(input: T): R; name: string }[] = [];
  private initialInput: T;

  constructor(initialInput: T) {
    this.initialInput = initialInput;
  }

  addValidator(validator: Validator<T>, name: string = "Unnamed Validator"): this {
    this.validators.push({ validator, name });
    return this;
  }

  addTransformer(transformer: <T, R>(input: T): R, name: string = "Unnamed Transformer"): this {
    this.transformers.push({ transformer, name });
    return this;
  }

  build(): ValidationChainExecutor {
    return {
      execute: (input: T): { result: any; errors: string[] } => {
        let currentResult: any = input;
        let errors: string[] = [];

        // 1. Run Validators
        for (const { validator, name } of this.validators) {
          const validationResult = validator.validate(currentResult);
          if (!validationResult.isValid) {
            errors.push(`Validator "${name}" failed: ${validationResult.errors.join(", ")}`);
          }
        }

        // 2. Run Transformers sequentially
        for (const { transformer, name } of this.transformers) {
          try {
            // The transformer must handle the type change if it's not T -> T
            // For simplicity in this builder, we assume the transformer can accept the current state.
            // A more complex system would track the intermediate type.
            const transformedValue = transformer(currentResult);
            currentResult = transformedValue;
          } catch (e) {
            errors.push(`Transformer "${name}" failed during execution: ${(e as Error).message}`);
          }
        }

        return {
          result: currentResult,
          errors: errors,
        };
      },
    };
  }
}

export { ValidationChainBuilder };