import { Message } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type ValidationStep = (data: Record<string, unknown>) => ValidationResult;

export class StructuredValidator {
  private readonly schema: Record<string, unknown>;
  private readonly validationSteps: ValidationStep[];

  constructor(schema: Record<string, unknown>, validationSteps: ValidationStep[]) {
    this.schema = schema;
    this.validationSteps = validationSteps;
  }

  private validateSchema(data: Record<string, unknown>): ValidationResult {
    // Placeholder for actual JSON schema validation logic (e.g., using ajv)
    // For this implementation, we assume schema validation passes if the structure exists.
    const errors: string[] = [];
    if (typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ["Input data must be a non-null object."] };
    }
    return { isValid: true, errors: [] };
  }

  public validate(data: Record<string, unknown>): ValidationResult {
    let accumulatedErrors: string[] = [];
    let isValid = true;

    // 1. Schema Validation
    const schemaValidation = this.validateSchema(data);
    if (!schemaValidation.isValid) {
      accumulatedErrors.push(...schemaValidation.errors);
      isValid = false;
    }

    // 2. Custom Step Validation
    for (const step of this.validationSteps) {
      const result = step(data);
      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
        isValid = false;
      }
    }

    return {
      isValid: isValid && accumulatedErrors.length === 0,
      errors: accumulatedErrors,
    };
  }
}

export function createStructuredValidator(
  schema: Record<string, unknown>,
  validationSteps: ValidationStep[]
): StructuredValidator {
  return new StructuredValidator(schema, validationSteps);
}