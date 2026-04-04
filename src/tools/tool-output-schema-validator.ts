import { JsonSchemaType, JsonSchemaValidator } from "ajv";

export interface ValidationResult {
  success: boolean;
  error?: string;
  path?: string;
}

export class ToolOutputSchemaValidator {
  private schema: unknown;
  private ajv: JsonSchemaValidator;

  constructor(schema: unknown) {
    this.schema = schema;
    this.ajv = new JsonSchemaValidator();
    this.ajv.addSchema(this.schema, true);
  }

  public validate(output: unknown): ValidationResult {
    const isValid = this.ajv.validate(this.schema, output);

    if (isValid) {
      return { success: true };
    }

    const errors = this.ajv.errors || [];
    const firstError = errors[0];

    if (firstError) {
      const path = firstError.instancePath ? firstError.instancePath.substring(1) : undefined;
      const message = firstError.message;
      return {
        success: false,
        error: `Validation failed at path: ${path || 'root'}. Reason: ${message}`,
        path: path,
      };
    }

    return {
      success: false,
      error: "Unknown validation error occurred.",
    };
  }
}