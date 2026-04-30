import { ValidatorBase } from "./validator-base";

export type ValidationReport = {
  isValid: boolean;
  errors: string[];
  details: Record<string, any>;
};

export interface SchemaDefinition {
  type: string;
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: {
    type: string;
    properties?: Record<string, SchemaDefinition>;
    required?: string[];
  };
}

export class StructuredToolOutputSchemaValidatorV1020 extends ValidatorBase {
  private primarySchema: SchemaDefinition;
  private secondarySchemas: SchemaDefinition[];

  constructor(primarySchema: SchemaDefinition, secondarySchemas: SchemaDefinition[] = []) {
    super();
    this.primarySchema = primarySchema;
    this.secondarySchemas = secondarySchemas;
  }

  validate(data: unknown): ValidationReport {
    const report: ValidationReport = {
      isValid: true,
      errors: [],
      details: {},
    };

    if (typeof data !== 'object' || data === null) {
      report.isValid = false;
      report.errors.push("Input data must be a non-null object.");
      return report;
    }

    // 1. Validate against Primary Schema
    const primaryValidation = this.validateObject(data, this.primarySchema, "Primary Schema");
    if (!primaryValidation.isValid) {
      report.isValid = false;
      report.errors.push("Primary Schema validation failed.");
      report.details["primary"] = primaryValidation.details;
    }

    // 2. Validate against Secondary Schemas
    for (let i = 0; i < this.secondarySchemas.length; i++) {
      const secondarySchema = this.secondarySchemas[i];
      const secondaryValidation = this.validateObject(data, secondarySchema, `Secondary Schema ${i + 1}`);
      if (!secondaryValidation.isValid) {
        report.isValid = false;
        report.errors.push(`Secondary Schema ${i + 1} validation failed.`);
        report.details[`secondary_${i + 1}`] = secondaryValidation.details;
      }
    }

    return report;
  }

  private validateObject(data: unknown, schema: SchemaDefinition, schemaName: string): ValidationReport {
    const report: ValidationReport = {
      isValid: true,
      errors: [],
      details: {},
    };

    if (typeof data !== 'object' || data === null) {
      report.isValid = false;
      report.errors.push(`Expected object for ${schemaName}, received ${typeof data}.`);
      return report;
    }

    const object = data as Record<string, unknown>;
    const properties = schema.properties || {};
    const required = schema.required || [];

    // Check for required fields
    for (const key of required) {
      if (!(key in object) || object[key] === undefined || object[key] === null) {
        report.isValid = false;
        report.errors.push(`Missing required property: "${key}" defined by ${schemaName}.`);
      }
    }

    // Check properties
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        const propSchema = properties[key];
        const value = object[key];

        if (value === undefined || value === null) continue;

        if (propSchema.type === "object") {
          const subReport = this.validateObject(value, propSchema, `${schemaName}.${key}`);
          if (!subReport.isValid) {
            report.isValid = false;
            report.errors.push(`${schemaName}.${key} validation failed.`);
            report.details[`${key}`] = subReport.details;
          }
        } else if (propSchema.type === "array" && propSchema.items) {
          const arrayReport = this.validateArray(value, propSchema.items, `${schemaName}.${key}`);
          if (!arrayReport.isValid) {
            report.isValid = false;
            report.errors.push(`${schemaName}.${key} array validation failed.`);
            report.details[`${key}`] = arrayReport.details;
          }
        } else {
          // Basic type check (simplified for this context)
          const actualType = typeof value;
          if (propSchema.type && propSchema.type !== "any" && actualType !== propSchema.type) {
            report.isValid = false;
            report.errors.push(`Type mismatch for "${key}". Expected ${propSchema.type}, got ${actualType}.`);
          }
        }
      }
    }

    return report;
  }

  private validateArray(data: unknown, itemSchema: SchemaDefinition, path: string): ValidationReport {
    const report: ValidationReport = { isValid: true, errors: [], details: {} };

    if (!Array.isArray(data)) {
      report.isValid = false;
      report.errors.push(`Expected an array at ${path}, but received ${typeof data}.`);
      return report;
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const itemPath = `${path}[${i}]`;
      const subReport = this.validateObject(item, itemSchema, itemPath);
      if (!subReport.isValid) {
        report.isValid = false;
        report.errors.push(`${itemPath} validation failed.`);
        report.details[i] = subReport.details;
      }
    }
    return report;
  }
}