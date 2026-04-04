import { PipelineStep, PipelineContext } from "./pipeline-step";

export interface Schema {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array";
    required?: boolean;
    properties?: {
      [key: string]: Schema;
    };
    items?: Schema;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    path: string;
  }[];
}

interface SchemaValidator {
  validate(output: unknown, schema: Schema): ValidationResult;
}

class DefaultSchemaValidator implements SchemaValidator {
  validate(output: unknown, schema: Schema): ValidationResult {
    const errors: { field: string; message: string; path: string }[] = [];
    const result: ValidationResult = { isValid: true, errors };

    const validateObject = (data: unknown, schema: Schema, path: string) => {
      if (typeof data !== "object" || data === null) {
        if (schema.required) {
          errors.push({ field: "root", message: "Expected an object.", path: path });
        }
        return;
      }

      const dataObject = data as Record<string, unknown>;

      for (const key in schema) {
        const fieldSchema = schema[key];
        const fullPath = path ? `${path}.${key}` : key;
        const value = dataObject[key];
        const isPresent = Object.prototype.hasOwnProperty.call(dataObject, key);

        if (fieldSchema.required && !isPresent) {
          errors.push({ field: key, message: "Missing required field.", path: fullPath });
          continue;
        }

        if (!isPresent) continue;

        switch (fieldSchema.type) {
          case "string":
            if (typeof value !== "string") {
              errors.push({ field: key, message: `Expected type 'string', got '${typeof value}'.`, path: fullPath });
            }
            break;
          case "number":
            if (typeof value !== "number") {
              errors.push({ field: key, message: `Expected type 'number', got '${typeof value}'.`, path: fullPath });
            }
            break;
          case "boolean":
            if (typeof value !== "boolean") {
              errors.push({ field: key, message: `Expected type 'boolean', got '${typeof value}'.`, path: fullPath });
            }
            break;
          case "object":
            if (typeof value !== "object" || value === null) {
              errors.push({ field: key, message: "Expected type 'object'.", path: fullPath });
            } else if (fieldSchema.properties) {
              validateObject(value, fieldSchema.properties, fullPath);
            }
            break;
          case "array":
            if (!Array.isArray(value)) {
              errors.push({ field: key, message: "Expected type 'array'.", path: fullPath });
            } else if (fieldSchema.items) {
              value.forEach((item, index) => {
                const itemPath = `${fullPath}[${index}]`;
                if (typeof item !== "object" || item === null) {
                    errors.push({ field: key, message: "Array item must be an object.", path: itemPath });
                    return;
                }
                validateObject(item, fieldSchema.items, itemPath);
              });
            }
            break;
        }
      }
    };

    validateObject(output, schema, "");
    result.isValid = errors.length === 0;
    return result;
  }
}

export class ToolOutputSchemaValidationPipeline implements PipelineStep {
  private validator: SchemaValidator;

  constructor(validator: SchemaValidator = new DefaultSchemaValidator()) {
    this.validator = validator;
  }

  async execute(context: PipelineContext): Promise<any> {
    const toolOutput = context.get<unknown>("tool_output");
    const schema = context.get<Schema>("schema");

    if (!toolOutput || !schema) {
      return { validationPassed: false, result: { message: "Missing tool_output or schema in context." } };
    }

    const validationResult = this.validator.validate(toolOutput, schema);

    if (!validationResult.isValid) {
      return { validationPassed: false, result: { message: "Schema validation failed.", errors: validationResult.errors } };
    }

    return { validationPassed: true, result: { message: "Schema validation successful." } };
  }
}