import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Schema<T> = {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array";
    required?: boolean;
    schema?: Schema<any>;
  };
};

type CrossFieldValidator<T> = (data: T) => {
  isValid: boolean;
  message?: string;
};

export class StructuredToolOutputSchemaValidatorV1011<T extends Record<string, any>> {
  private schema: Schema<T>;
  private crossFieldValidators: Array<CrossFieldValidator<T>>;

  constructor(schema: Schema<T>) {
    this.schema = schema;
    this.crossFieldValidators = [];
  }

  addCrossFieldValidator(validatorFn: CrossFieldValidator<T>): this {
    this.crossFieldValidators.push(validatorFn);
    return this;
  }

  private validateBasicTypes(data: T): { isValid: boolean; message?: string } {
    for (const key in this.schema) {
      const fieldSchema = this.schema[key];
      const value = data[key];

      if (fieldSchema.required && (value === undefined || value === null)) {
        return { isValid: false, message: `${key} is required.` };
      }

      if (value === undefined || value === null) {
        continue;
      }

      switch (fieldSchema.type) {
        case "string":
          if (typeof value !== "string") {
            return { isValid: false, message: `${key} must be a string.` };
          }
          break;
        case "number":
          if (typeof value !== "number") {
            return { isValid: false, message: `${key} must be a number.` };
          }
          break;
        case "boolean":
          if (typeof value !== "boolean") {
            return { isValid: false, message: `${key} must be a boolean.` };
          }
          break;
        case "object":
          if (typeof value !== "object" || Array.isArray(value) || value === null) {
            return { isValid: false, message: `${key} must be an object.` };
          }
          if (fieldSchema.schema) {
            const nestedValidator = new StructuredToolOutputSchemaValidatorV1011(fieldSchema.schema);
            const nestedResult = nestedValidator.validate(value);
            if (!nestedResult.isValid) {
              return { isValid: false, message: `${key} validation failed: ${nestedResult.message}` };
            }
          }
          break;
        case "array":
          if (!Array.isArray(value)) {
            return { isValid: false, message: `${key} must be an array.` };
          }
          // Basic array check, deeper validation omitted for brevity/scope
          break;
      }
    }
    return { isValid: true };
  }

  public validate(data: T): { isValid: boolean; message?: string } {
    // 1. Basic Type Validation
    const basicValidation = this.validateBasicTypes(data);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // 2. Cross-Field Validation
    for (const validator of this.crossFieldValidators) {
      const result = validator(data);
      if (!result.isValid) {
        return { isValid: false, message: result.message || "Cross-field validation failed." };
      }
    }

    return { isValid: true };
  }
}