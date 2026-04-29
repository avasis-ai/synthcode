import { Message, ToolResultMessage } from "./types";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

type ValidatorFunction<T> = (data: T) => ValidationResult;

interface AdvancedValidator<T> {
  validate: (data: T) => ValidationResult;
}

class TemporalConstraintValidator<T> implements AdvancedValidator<T> {
  private readonly fieldPairs: { key1: keyof T; key2: keyof T; check: (v1: any, v2: any) => boolean };

  constructor(fieldPairs: { key1: keyof T; key2: keyof T; check: (v1: any, v2: any) => boolean }[]) {
    this.fieldPairs = fieldPairs;
  }

  validate(data: T): ValidationResult {
    const errors: string[] = [];
    for (const { key1, key2, check } of this.fieldPairs) {
      const v1 = data[key1];
      const v2 = data[key2];
      if (v1 !== undefined && v2 !== undefined && !check(v1, v2)) {
        errors.push(`Temporal constraint failed: ${key1} (${v1}) must be consistent with ${key2} (${v2}).`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

class CrossFieldDependencyValidator<T> implements AdvancedValidator<T> {
  private readonly dependencyChecks: ((data: T) => string | null)[];

  constructor(dependencyChecks: ((data: T) => string | null)[]) {
    this.dependencyChecks = dependencyChecks;
  }

  validate(data: T): ValidationResult {
    const errors: string[] = [];
    for (const check of this.dependencyChecks) {
      const error = check(data);
      if (error) {
        errors.push(error);
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

export class StructuredToolOutputSchemaValidatorAdvanced<T> {
  private readonly validators: { validator: AdvancedValidator<T>; name: string }[] = [];

  addValidator(validator: AdvancedValidator<T>, name: string): this {
    this.validators.push({ validator, name });
    return this;
  }

  validate(data: T): ValidationResult {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const { validator, name } of this.validators) {
      const result = validator.validate(data);
      if (!result.isValid) {
        allErrors.push(`[${name}] Failed: ${result.errors.join('; ')}`);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}