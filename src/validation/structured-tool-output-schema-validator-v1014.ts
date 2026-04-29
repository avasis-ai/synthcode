import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaValidator<T> = (data: T) => { isValid: boolean; errors: string[] };

interface ValidationStep<TInput, TOutput> {
  validator: SchemaValidator<TInput>;
  transformer: (input: TInput) => TOutput;
}

export class StructuredToolOutputSchemaValidator {
  private steps: ValidationStep<any, any>[] = [];
  private finalSchema: Record<string, unknown> | null = null;

  private constructor() {}

  public static getInstance(): StructuredToolOutputSchemaValidator {
    if (!StructuredToolOutputSchemaValidator.instance) {
      StructuredToolOutputSchemaValidator.instance = new StructuredToolOutputSchemaValidator();
    }
    return StructuredToolOutputSchemaValidator.instance;
  }

  public static get instance(): StructuredToolOutputSchemaValidator {
    if (!StructuredToolOutputSchemaValidator.instance) {
      StructuredToolOutputSchemaValidator.instance = new StructuredToolOutputSchemaValidator();
    }
    return StructuredToolOutputSchemaValidator.instance;
  }

  public addStep<TInput, TOutput>(
    validator: SchemaValidator<TInput>,
    transformer: (input: TInput) => TOutput
  ): this {
    this.steps.push({ validator, transformer });
    return this;
  }

  public withFinalSchema(schema: Record<string, unknown>): this {
    this.finalSchema = schema;
    return this;
  }

  public validate(
    initialData: Record<string, unknown>
  ): { isValid: boolean; finalOutput: Record<string, unknown>; errors: string[] } {
    let currentData: Record<string, unknown> = initialData;
    let errors: string[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const stepErrors: string[] = [];

      // 1. Validate current state against the step's input schema
      const validationResult = step.validator(currentData as any);
      if (!validationResult.isValid) {
        stepErrors.push(...validationResult.errors);
      }

      if (stepErrors.length > 0) {
        errors.push(`Step ${i + 1} validation failed: ${stepErrors.join('; ')}`);
        // Stop processing on validation failure to prevent cascading errors
        return { isValid: false, finalOutput: currentData, errors: errors };
      }

      // 2. Transform data for the next step
      try {
        currentData = step.transformer(currentData as any);
      } catch (e) {
        errors.push(`Step ${i + 1} transformation failed: ${(e as Error).message}`);
        return { isValid: false, finalOutput: currentData, errors: errors };
      }
    }

    // 3. Final Schema Validation
    if (this.finalSchema) {
      const finalValidationResult = this.validateAgainstSchema(currentData, this.finalSchema);
      if (!finalValidationResult.isValid) {
        errors.push(`Final schema validation failed: ${finalValidationResult.errors.join('; ')}`);
        return { isValid: false, finalOutput: currentData, errors: errors };
      }
    }

    return { isValid: true, finalOutput: currentData, errors: [] };
  }

  private validateAgainstSchema(data: Record<string, unknown>, schema: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const key in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        const expectedType = schema[key] as string;
        const actualValue = data[key];

        if (actualValue === undefined) {
          if (schema[key] && typeof schema[key] === 'boolean' && (schema[key] as boolean) === false) {
            continue; // Optional field missing
          } else {
            errors.push(`Missing required field: ${key}`);
          }
        } else if (typeof actualValue !== 'object' || actualValue === null) {
          if (expectedType === 'string' && typeof actualValue === 'string') {
            continue;
          }
          errors.push(`Field ${key} expected type ${expectedType}, but got ${typeof actualValue}`);
        } else {
          // Basic type checking for objects/records
          if (expectedType === 'object' && typeof actualValue === 'object') {
            // In a real scenario, this would recursively validate sub-schemas
          }
        }
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}