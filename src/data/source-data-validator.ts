import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult<T> = {
  isValid: boolean;
  errors: string[];
  value: T;
};

type TransformationFunction<T, R> = (value: T) => R;

interface ValidationRule<T> {
  validate: (value: unknown) => ValidationResult<T>;
  transform?: TransformationFunction<T, unknown>;
}

interface SourceSchema {
  [key: string]: ValidationRule<any>;
}

class SourceDataValidator {
  private schema: SourceSchema;

  constructor(schema: SourceSchema) {
    this.schema = schema;
  }

  private validateField(fieldName: string, rawValue: unknown): ValidationResult<unknown> {
    const rule = this.schema[fieldName];
    if (!rule) {
      return { isValid: true, errors: [], value: rawValue };
    }

    const validationResult = rule.validate(rawValue);

    if (!validationResult.isValid) {
      return { isValid: false, errors: [...validationResult.errors, `Validation failed for ${fieldName}`], value: rawValue };
    }

    const transformedValue = rule.transform ? rule.transform(validationResult.value) : validationResult.value;

    return { isValid: true, errors: [], value: transformedValue };
  }

  private resolveConflict(existingValue: unknown, newValue: unknown): unknown {
    if (existingValue === null || existingValue === undefined) {
      return newValue;
    }
    if (newValue === null || newValue === undefined) {
      return existingValue;
    }

    // Simple conflict resolution: prefer the non-null, non-empty string value
    const existingString = String(existingValue).trim();
    const newString = String(newValue).trim();

    if (existingString && newString) {
      return newString; // Example: Prefer newer data
    }
    if (existingString) {
      return existingValue;
    }
    return newValue;
  }

  public validateAndTransform(rawData: Record<string, unknown>, existingContext: Record<string, unknown> = {}): {
    isValid: boolean;
    errors: string[];
    transformedData: Record<string, unknown>;
  } {
    const transformedData: Record<string, unknown> = {};
    const errors: string[] = [];
    let overallValid = true;

    for (const fieldName in this.schema) {
      if (Object.prototype.hasOwnProperty.call(this.schema, fieldName)) {
        const rawValue = rawData[fieldName];
        const validationResult = this.validateField(fieldName, rawValue);

        if (!validationResult.isValid) {
          overallValid = false;
          errors.push(...validationResult.errors);
        }

        const resolvedValue = this.resolveConflict(existingContext[fieldName], validationResult.value);
        transformedData[fieldName] = resolvedValue;
      }
    }

    return {
      isValid: overallValid,
      errors: errors,
      transformedData: transformedData,
    };
  }
}

export { SourceDataValidator };