import { Message, ToolResultMessage } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  output: unknown;
};

export interface ValidationStep {
  validate(input: unknown): ValidationResult;
}

export class ToolOutputSchemaValidator {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[] = []) {
    this.steps = steps;
  }

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public runPipeline(input: unknown): ValidationResult {
    let currentOutput: unknown = input;
    let allErrors: string[] = [];
    let isValid = true;

    for (const step of this.steps) {
      const result = step.validate(currentOutput);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        isValid = false;
        // Decide on fail-fast vs continue. Here, we continue to collect all errors.
        // If strict fail-fast is required, return early here.
      }
      // Pass the output of the current step (or the original if the step doesn't modify it)
      // For simplicity in this pipeline, we pass the result's output if available, otherwise, the original.
      currentOutput = result.output !== undefined ? result.output : currentOutput;
    }

    return {
      isValid: isValid && allErrors.length === 0,
      errors: allErrors,
      output: currentOutput,
    };
  }
}

export class RequiredFieldValidator implements ValidationStep {
  private fieldName: string;

  constructor(fieldName: string) {
    this.fieldName = fieldName;
  }

  validate(input: unknown): ValidationResult {
    if (typeof input !== 'object' || input === null) {
      return { isValid: false, errors: [`Input must be an object to check for field '${this.fieldName}'.`], output: input };
    }

    const hasField = (input as Record<string, unknown>).hasOwnProperty(this.fieldName);

    if (!hasField) {
      return { isValid: false, errors: [`Missing required field: '${this.fieldName}'.`], output: input };
    }

    return { isValid: true, errors: [], output: input };
  }
}

export class TypeValidator<T extends Record<string, unknown>> implements ValidationStep {
  private schema: Partial<T>;

  constructor(schema: Partial<T>) {
    this.schema = schema;
  }

  validate(input: unknown): ValidationResult {
    if (typeof input !== 'object' || input === null) {
      return { isValid: false, errors: ["Input must be a non-null object."], output: input };
    }

    const inputObject = input as T;
    let errors: string[] = [];
    let isValid = true;

    for (const key in this.schema) {
      if (Object.prototype.hasOwnProperty.call(this.schema, key)) {
        const expectedType = this.schema[key];
        const actualValue = (inputObject as Record<string, unknown>)[key];

        if (actualValue === undefined) {
          errors.push(`Field '${key}' is missing.`);
          isValid = false;
          continue;
        }

        // Basic type checking simulation
        const actualType = typeof actualValue;
        if (expectedType !== undefined) {
          const expectedTypeName = typeof expectedType;

          if (expectedTypeName === 'string' && actualType !== 'string') {
            errors.push(`Field '${key}' expected type 'string', but got '${actualType}'.`);
            isValid = false;
          } else if (expectedTypeName === 'number' && actualType !== 'number') {
            errors.push(`Field '${key}' expected type 'number', but got '${actualType}'.`);
            isValid = false;
          } else if (expectedTypeName === 'boolean' && actualType !== 'boolean') {
            errors.push(`Field '${key}' expected type 'boolean', but got '${actualType}'.`);
            isValid = false;
          }
          // Add more complex type checks (e.g., array length, object structure) as needed
        }
      }
    }

    return { isValid: isValid && errors.length === 0, errors: errors, output: input };
  }
}