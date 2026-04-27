import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ToolOutputValidator {
  validate(data: any, schema: any): ValidationResult;
}

export class SchemaEvolutionValidator implements ToolOutputValidator {
  validate(data: any, schema: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    if (typeof schema !== 'object' || schema === null || typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ["Schema and data must be non-null objects."], warnings: [] };
    }

    const schemaKeys: string[] = Object.keys(schema);
    const dataKeys: string[] = Object.keys(data);

    // Check for missing required fields (basic check)
    for (const key of schemaKeys) {
      if (schema[key] && typeof schema[key] === 'object' && 'required' in schema[key] && (schema[key] as any).required && !(key in data)) {
        errors.push(`Missing required field: ${key}`);
        isValid = false;
      }
    }

    // Check for unexpected fields (simple check)
    for (const key of dataKeys) {
      if (!schemaKeys.includes(key)) {
        warnings.push(`Unexpected field found: ${key}`);
      }
    }

    return { isValid: errors.length === 0, errors: errors, warnings: warnings };
  }
}

export class TypeValidator implements ToolOutputValidator {
  validate(data: any, schema: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    if (typeof schema !== 'object' || schema === null || typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ["Schema and data must be non-null objects."], warnings: [] };
    }

    const schemaKeys: string[] = Object.keys(schema);

    for (const key of schemaKeys) {
      const fieldSchema = schema[key];
      if (typeof fieldSchema !== 'object' || fieldSchema === null) continue;

      const expectedType = fieldSchema.type;
      const actualValue = data[key];

      if (actualValue === undefined) continue;

      let typeMatch = false;
      switch (expectedType) {
        case 'string':
          typeMatch = typeof actualValue === 'string';
          break;
        case 'number':
          typeMatch = typeof actualValue === 'number' && !isNaN(actualValue);
          break;
        case 'boolean':
          typeMatch = typeof actualValue === 'boolean';
          break;
        case 'object':
          typeMatch = typeof actualValue === 'object' && actualValue !== null && !Array.isArray(actualValue);
          break;
        default:
          // Unknown type, assume pass for simplicity or error out
          break;
      }

      if (!typeMatch) {
        errors.push(`Field '${key}' expected type '${expectedType}', but got '${typeof actualValue}'`);
        isValid = false;
      }
    }

    return { isValid: errors.length === 0, errors: errors, warnings: warnings };
  }
}

export class ToolOutputSchemaValidationPipelineV10 {
  private validators: ToolOutputValidator[];

  constructor(initialValidators: ToolOutputValidator[] = []) {
    this.validators = [...initialValidators];
  }

  addValidator(validator: ToolOutputValidator): this {
    this.validators.push(validator);
    return this;
  }

  validate(data: any, schema: any): ValidationResult {
    let currentResult: ValidationResult = { isValid: true, errors: [], warnings: [] };

    for (const validator of this.validators) {
      const result = validator.validate(data, schema);

      if (!result.isValid) {
        currentResult.isValid = false;
      }
      currentResult.errors.push(...result.errors);
      currentResult.warnings.push(...result.warnings);
    }

    return currentResult;
  }
}

export const createValidationPipeline = (): ToolOutputSchemaValidationPipelineV10 => {
  const pipeline = new ToolOutputSchemaValidationPipelineV10();

  // 1. Schema Evolution Check (Run first to catch structural drift)
  pipeline.addValidator(new SchemaEvolutionValidator());

  // 2. Type Checking
  pipeline.addValidator(new TypeValidator());

  // Future validators can be added here (e.g., RequiredFieldValidator, CustomConstraintValidator)

  return pipeline;
};