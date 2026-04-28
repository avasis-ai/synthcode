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

type SchemaDefinition = Record<string, any>;

export interface ValidationError {
  path: string;
  message: string;
  constraint: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
}

interface Constraint {
  validate(data: any, path: string): ValidationError[] | null;
}

class SchemaValidator {
  private schema: SchemaDefinition;
  private constraints: Constraint[] = [];

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  withConstraint(constraint: Constraint): this {
    this.constraints.push(constraint);
    return this;
  }

  build(): SchemaValidator {
    return this;
  }

  private validateObject(data: any, schema: SchemaDefinition, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof data !== 'object' || data === null) {
      return [{ path, message: 'Expected an object', constraint: 'type' }];
    }

    const requiredFields = schema.required || [];
    const properties = schema.properties || {};

    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push({ path: `${path}.${field}`, message: 'Required field missing', constraint: 'required' });
      }
    }

    // Validate properties
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        const propSchema = properties[key];
        const value = data[key];
        const currentPath = `${path}.${key}`;

        if (value === undefined || value === null) continue;

        // Basic type check (simplified)
        if (propSchema.type && typeof value !== 'object' && !['string', 'number', 'boolean'].includes(propSchema.type)) {
            // Skip complex type checking for brevity, focusing on structure
        }

        // Recursive validation for nested objects
        if (propSchema.properties && typeof value === 'object' && value !== null) {
          const nestedErrors = this.validateObject(value, propSchema, currentPath);
          errors.push(...nestedErrors);
        }

        // Apply custom constraints
        for (const constraint of this.constraints) {
          const constraintErrors = constraint.validate(value, currentPath);
          if (constraintErrors) {
            errors.push(...constraintErrors);
          }
        }
      }
    }
    return errors;
  }

  public validate(data: any): ValidationReport {
    const errors: ValidationError[] = [];
    const initialErrors = this.validateObject(data, this.schema, "");
    errors.push(...initialErrors);

    // Run global constraints (if any were added that don't rely on object traversal)
    for (const constraint of this.constraints) {
        const constraintErrors = constraint.validate(data, "");
        if (constraintErrors) {
            errors.push(...constraintErrors);
        }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export class StructuredToolOutputSchemaValidatorV1 {
  private validator: SchemaValidator;

  constructor(schema: SchemaDefinition) {
    this.validator = new SchemaValidator(schema);
  }

  public withConstraint(constraint: Constraint): StructuredToolOutputSchemaValidatorV1 {
    this.validator.withConstraint(constraint);
    return this;
  }

  public build(): StructuredToolOutputSchemaValidatorV1 {
    return this;
  }

  public validate(data: any): ValidationReport {
    return this.validator.validate(data);
  }
}

class RequiredConstraint implements Constraint {
  validate(data: any, path: string): ValidationError[] | null {
    if (data === undefined || data === null || (typeof data === 'string' && data.trim() === '')) {
      return [{ path, message: 'Field is required and cannot be empty', constraint: 'required' }];
    }
    return null;
  }
}

class RegexConstraint implements Constraint {
  private regex: RegExp;

  constructor(regex: RegExp) {
    this.regex = regex;
  }

  validate(data: any, path: string): ValidationError[] | null {
    if (typeof data === 'string' && !this.regex.test(data)) {
      return [{ path, message: `Must match pattern: ${this.regex.toString()}`, constraint: 'regex' }];
    }
    return null;
  }
}

export class TemporalConstraint implements Constraint {
  validate(data: any, path: string): ValidationError[] | null {
    if (typeof data !== 'string') {
      return null;
    }
    const date = new Date(data);
    if (isNaN(date.getTime())) {
      return [{ path, message: 'Invalid date format', constraint: 'temporal' }];
    }
    return null;
  }
}