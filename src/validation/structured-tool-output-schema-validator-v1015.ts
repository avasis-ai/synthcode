import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  output: unknown;
};

interface Validator {
  validate(input: unknown): ValidationResult;
}

interface Transformer {
  transform(input: unknown): unknown;
}

export class StructuredToolOutputSchemaValidatorV1015 {
  private steps: Array<{ validator: Validator; transformer?: Transformer }>;

  private constructor(steps: Array<{ validator: Validator; transformer?: Transformer }>) {
    this.steps = steps;
  }

  public static create(steps: Array<{ validator: Validator; transformer?: Transformer }>): StructuredToolOutputSchemaValidatorV1015 {
    return new StructuredToolOutputSchemaValidatorV1015(steps);
  }

  public validate(initialInput: unknown): ValidationResult {
    let currentOutput: unknown = initialInput;
    let accumulatedErrors: string[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      // 1. Apply Transformer if present
      if (step.transformer) {
        try {
          currentOutput = step.transformer.transform(currentOutput);
        } catch (e) {
          return {
            isValid: false,
            errors: [`Transformation failed at step ${i}: ${(e as Error).message}`],
            output: currentOutput,
          };
        }
      }

      // 2. Validate
      const validationResult = step.validator.validate(currentOutput);
      if (!validationResult.isValid) {
        accumulatedErrors = [...accumulatedErrors, ...validationResult.errors];
      }
      currentOutput = validationResult.output;
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      output: currentOutput,
    };
  }
}

export class ValidatorBuilder {
  private steps: Array<{ validator: Validator; transformer?: Transformer }> = [];

  public addValidator(validator: Validator): ValidatorBuilder {
    this.steps.push({ validator: validator });
    return this;
  }

  public addTransformerAndValidator(transformer: Transformer, validator: Validator): ValidatorBuilder {
    this.steps.push({ validator: validator, transformer: transformer });
    return this;
  }

  public build(): StructuredToolOutputSchemaValidatorV1015 {
    return StructuredToolOutputSchemaValidatorV1015.create(this.steps);
  }
}