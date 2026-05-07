import { Message } from "../types/message.js";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface EventValidator<T> {
  validate(payload: T): ValidationResult;
}

export class DomainEventValidator<T> {
  private validators: EventValidator<T>[] = [];

  constructor() {}

  addValidator(validator: EventValidator<T>): void {
    this.validators.push(validator);
  }

  validate(payload: T): ValidationResult {
    const errors: string[] = [];
    for (const validator of this.validators) {
      const result = validator.validate(payload);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  static create(): DomainEventValidator<any> {
    return new DomainEventValidator<any>();
  }
}

export class PayloadSchemaValidator implements EventValidator<any> {
  private schema: Record<string, any>;

  constructor(schema: Record<string, any>) {
    this.schema = schema;
  }

  validate(payload: any): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    for (const key in this.schema) {
      if (Object.prototype.hasOwnProperty.call(this.schema, key)) {
        const expectedType = this.schema[key].type;
        const value = payload[key];

        if (value === undefined) {
          if (this.schema[key].required) {
            errors.push(`Missing required field: ${key}`);
            isValid = false;
          }
          continue;
        }

        if (expectedType && typeof value !== expectedType) {
          errors.push(`Field ${key} must be of type ${expectedType}, but received ${typeof value}`);
          isValid = false;
        }
      }
    }

    return {
      isValid: isValid && errors.length === 0,
      errors: errors,
    };
  }
}