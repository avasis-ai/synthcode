import { Message, ToolResultMessage } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

interface FieldValidator<T> {
  validate(value: T, context: Record<string, unknown>): string[] | null;
}

interface ConditionalValidator {
  condition(context: Record<string, unknown>): boolean;
  validate(context: Record<string, unknown>): string[] | null;
}

interface SchemaValidator {
  validate(data: Record<string, unknown>): string[] | null;
}

type AdvancedValidator = FieldValidator<any> | ConditionalValidator | SchemaValidator;

class StructuredToolOutputSchemaValidatorV1028 {
  private validators: AdvancedValidator[] = [];

  private constructor() {}

  private static instance(): StructuredToolOutputSchemaValidatorV1028 {
    if (!StructuredToolOutputSchemaValidatorV1028.instance) {
      StructuredToolOutputSchemaValidatorV1028.instance = new StructuredToolOutputSchemaValidatorV1028();
    }
    return StructuredToolOutputSchemaValidatorV1028.instance;
  }

  public static getInstance(): StructuredToolOutputSchemaValidatorV1028 {
    return StructuredToolOutputSchemaValidatorV1028.instance();
  }

  public addValidator(validator: AdvancedValidator): this {
    this.validators.push(validator);
    return this;
  }

  private validateField(fieldName: string, value: unknown, context: Record<string, unknown>): string[] | null {
    for (const validator of this.validators) {
      if (typeof validator === 'FieldValidator<any>') {
        const fieldValidator = validator as FieldValidator<any>;
        const errors = fieldValidator.validate(value, context);
        if (errors) return errors;
      }
    }
    return null;
  }

  private validateConditional(context: Record<string, unknown>): string[] | null {
    for (const validator of this.validators) {
      if (typeof validator === 'ConditionalValidator') {
        const conditionalValidator = validator as ConditionalValidator;
        if (conditionalValidator.condition(context)) {
          const errors = conditionalValidator.validate(context);
          if (errors) return errors;
        }
      }
    }
    return null;
  }

  private validateSchema(data: Record<string, unknown>): string[] | null {
    for (const validator of this.validators) {
      if (typeof validator === 'SchemaValidator') {
        const schemaValidator = validator as SchemaValidator;
        const errors = schemaValidator.validate(data);
        if (errors) return errors;
      }
    }
    return null;
  }

  public validate(toolOutput: ToolResultMessage): ValidationResult {
    const context: Record<string, unknown> = {
      tool_use_id: toolOutput.tool_use_id,
      content: toolOutput.content,
      is_error: toolOutput.is_error ?? false,
    };

    const allErrors: string[] = [];

    // Simple field validation (assuming we check content/id structure)
    const fieldErrors = this.validateField("content", toolOutput.content, context);
    if (fieldErrors) allErrors.push(...fieldErrors);

    // Conditional validation (e.g., if is_error is true, content must be an error message)
    const conditionalErrors = this.validateConditional(context);
    if (conditionalErrors) allErrors.push(...conditionalErrors);

    // Schema validation (e.g., ensuring all required keys are present)
    const schemaErrors = this.validateSchema(context);
    if (schemaErrors) allErrors.push(...schemaErrors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

export { StructuredToolOutputSchemaValidatorV1028 };