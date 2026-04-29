import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface ValidatorStep {
  validate(data: unknown): ValidationResult;
}

export class SchemaValidator {
  private steps: ValidatorStep[] = [];

  addStep(step: ValidatorStep): this {
    this.steps.push(step);
    return this;
  }

  validate(data: unknown): ValidationResult {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step.validate(data);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}

class TypeValidator implements ValidatorStep {
  validate(data: unknown): ValidationResult {
    if (typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ["Input data must be a non-null object."] };
    }

    // Simplified type checking for demonstration
    if (Array.isArray(data)) {
      return { isValid: false, errors: ["Input data must be an object, not an array."] };
    }

    // In a real scenario, this would use a JSON Schema library or similar mechanism.
    // For this example, we assume the input structure is an object.
    return { isValid: true, errors: [] };
  }
}

class CrossFieldValidator implements ValidatorStep {
  private requiredFields: { [key: string]: { required: boolean; type: (value: unknown) => boolean } };

  constructor(fields: { [key: string]: { required: boolean; type: (value: unknown) => boolean } }) {
    this.requiredFields = fields;
  }

  validate(data: unknown): ValidationResult {
    const objectData = data as Record<string, unknown>;
    let errors: string[] = [];
    let isValid = true;

    for (const field in this.requiredFields) {
      const definition = this.requiredFields[field];
      const value = objectData[field];

      if (definition.required && (value === undefined || value === null)) {
        errors.push(`Missing required field: ${field}`);
        isValid = false;
        continue;
      }

      if (value !== undefined && value !== null && !definition.type(value)) {
        errors.push(`Field ${field} has an invalid type.`);
        isValid = false;
      }
    }

    return { isValid, errors };
  }
}

class TemporalValidator implements ValidatorStep {
  private readonly minTimestamp: number;
  private readonly maxTimestamp: number;

  constructor(min: number, max: number) {
    this.minTimestamp = min;
    this.maxTimestamp = max;
  }

  validate(data: unknown): ValidationResult {
    const timestamp = data as unknown as number;
    if (isNaN(timestamp) || typeof timestamp !== 'number') {
      return { isValid: false, errors: ["Input data must be a valid timestamp number."] };
    }

    if (timestamp < this.minTimestamp || timestamp > this.maxTimestamp) {
      return { isValid: false, errors: [`Timestamp ${timestamp} is outside the allowed range [${this.minTimestamp}, ${this.maxTimestamp}].`] };
    }

    return { isValid: true, errors: [] };
  }
}

export const createSchemaValidator = (
  crossFieldChecks: { [key: string]: { required: boolean; type: (value: unknown) => boolean } } = {},
  temporalConstraints: { min: number; max: number } | null = null
): SchemaValidator => {
  const validator = new SchemaValidator();

  validator.addStep(new TypeValidator());

  if (Object.keys(crossFieldChecks).length > 0) {
    validator.addStep(new CrossFieldValidator(crossFieldChecks));
  }

  if (temporalConstraints) {
    validator.addStep(new TemporalValidator(temporalConstraints.min, temporalConstraints.max));
  }

  return validator;
};