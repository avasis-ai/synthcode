import { Message, ToolResultMessage } from "./types";

export interface StructuredToolOutputValidator {
  validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

export interface ValidationStep {
  validator: StructuredToolOutputValidator;
  name: string;
}

export class StructuredToolOutputValidationPipeline {
  private steps: ValidationStep[];

  private constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public static create(steps: ValidationStep[]): StructuredToolOutputValidationPipeline {
    return new StructuredToolOutputValidationPipeline(steps);
  }

  public validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];
    let isValid = true;

    for (const step of this.steps) {
      const result = step.validator.validate(output);
      if (!result.isValid) {
        isValid = false;
        allErrors.push(...result.errors.map(err => `[${step.name}] ${err}`));
      }
    }

    return { isValid, errors: allErrors };
  }
}

class CrossFieldConstraintValidator implements StructuredToolOutputValidator {
  private constraints: { field1: string, field2: string, condition: (v1: unknown, v2: unknown) => boolean, errorMessage: string }[];

  constructor(constraints: { field1: string, field2: string, condition: (v1: unknown, v2: unknown) => boolean, errorMessage: string }[]) {
    this.constraints = constraints;
  }

  validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const constraint of this.constraints) {
      const v1 = output[constraint.field1];
      const v2 = output[constraint.field2];

      if (v1 !== undefined && v2 !== undefined && !constraint.condition(v1, v2)) {
        errors.push(constraint.errorMessage);
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

class NestedSchemaValidator implements StructuredToolOutputValidator {
  private schemaValidators: { path: string; validator: StructuredToolOutputValidator }[];

  constructor(schemaValidators: { path: string; validator: StructuredToolOutputValidator }[]) {
    this.schemaValidators = schemaValidators;
  }

  validate(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];
    for (const { path, validator } of this.schemaValidators) {
      const nestedOutput = this.getNestedValue(output, path);
      if (nestedOutput === undefined) continue;

      const result = validator.validate(nestedOutput);
      if (!result.isValid) {
        allErrors.push(...result.errors.map(err => `[${path}] ${err}`));
      }
    }
    return { isValid: allErrors.length === 0, errors: allErrors };
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
  }
}

export function buildStructuredToolOutputValidationPipeline(
  crossFieldConstraints: { field1: string, field2: string, condition: (v1: unknown, v2: unknown) => boolean, errorMessage: string }[],
  nestedSchemas: { path: string; validator: StructuredToolOutputValidator }[]
): StructuredToolOutputValidationPipeline {
  const crossFieldValidator = new CrossFieldConstraintValidator(crossFieldConstraints);
  const nestedValidator = new NestedSchemaValidator(nestedSchemas);

  const steps: ValidationStep[] = [
    { name: "CrossFieldConstraintValidator", validator: crossFieldValidator },
    { name: "NestedSchemaValidator", validator: nestedValidator },
  ];

  return StructuredToolOutputValidationPipeline.create(steps);
}