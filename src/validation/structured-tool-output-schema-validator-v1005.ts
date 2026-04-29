import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  Message,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ValidationError = {
  field: string;
  message: string;
  rule: string;
  value: unknown;
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export type CustomValidator<T> = (
  output: T,
  schema: any,
) => ValidationError[];

export class StructuredToolOutputSchemaValidatorV1005<T extends Record<string, unknown>> {
  private readonly customValidators: CustomValidator<T>[];

  constructor(customValidators: CustomValidator<T>[] = []) {
    this.customValidators = customValidators;
  }

  public validate(
    output: T,
    schema: any,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. Basic Schema Adherence Check (Simplified for this scope)
    // In a real scenario, this would involve deep JSON schema validation.
    if (typeof output !== 'object' || output === null) {
      errors.push({
        field: "root",
        message: "Output must be a non-null object.",
        rule: "TypeCheck",
        value: output,
      });
    } else {
      // Placeholder for basic type/presence checks against schema
      // For simplicity, we assume schema validation passes if the object exists.
    }

    // 2. Run Custom Validators Pipeline
    for (const validator of this.customValidators) {
      const ruleErrors = validator(output, schema);
      errors.push(...ruleErrors);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  public static create(customValidators: CustomValidator<any>[] = []): StructuredToolOutputSchemaValidatorV1005<any> {
    return new StructuredToolOutputSchemaValidatorV1005(customValidators);
  }
}