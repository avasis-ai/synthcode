import { Message } from "./message-types";

export type ValidationError = {
  field: string;
  message: string;
  constraint: string;
};

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
}

export interface SchemaValidator {
  validate(data: Record<string, unknown>, schema: Record<string, any>): ValidationError[] | null;
}

export class ToolOutputSchemaValidationPipeline {
  private readonly schema: Record<string, any>;
  private readonly validators: SchemaValidator[];

  constructor(schema: Record<string, any>, validators: SchemaValidator[]) {
    this.schema = schema;
    this.validators = validators;
  }

  public run(data: Record<string, unknown>): ValidationReport {
    let allErrors: ValidationError[] = [];

    for (const validator of this.validators) {
      const errors = validator.validate(data, this.schema);
      if (errors) {
        allErrors.push(...errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  public static create(schema: Record<string, any>, validators: SchemaValidator[]): ToolOutputSchemaValidationPipeline {
    return new ToolOutputSchemaValidationPipeline(schema, validators);
  }
}

class TypeValidator implements SchemaValidator {
  validate(data: Record<string, unknown>, schema: Record<string, any>): ValidationError[] | null {
    const errors: ValidationError[] = [];
    for (const field in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, field)) {
        const expectedType = schema[field].type;
        const value = data[field];

        if (value === undefined || value === null) continue;

        let actualType: string;
        if (typeof value === 'object' && !Array.isArray(value)) {
          actualType = 'object';
        } else if (Array.isArray(value)) {
          actualType = 'array';
        } else {
          actualType = typeof value;
        }

        if (expectedType && actualType !== expectedType) {
          errors.push({
            field: field,
            message: `Expected type '${expectedType}', but got '${actualType}'.`,
            constraint: "type",
          });
        }
      }
    }
    return errors.length > 0 ? errors : null;
  }
}

class RequiredValidator implements SchemaValidator {
  validate(data: Record<string, unknown>, schema: Record<string, any>): ValidationError[] | null {
    const errors: ValidationError[] = [];
    for (const field in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, field)) {
        const isRequired = (schema[field] as any)?.required === true;
        const value = data[field];

        if (isRequired && (value === undefined || value === null)) {
          errors.push({
            field: field,
            message: "This field is required but missing.",
            constraint: "required",
          });
        }
      }
    }
    return errors.length > 0 ? errors : null;
  }
}

export { ToolOutputSchemaValidationPipeline, TypeValidator, RequiredValidator };