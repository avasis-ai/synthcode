import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedData: Record<string, unknown>;
}

export interface ValidationStep {
  name: string;
  execute: (data: Record<string, unknown>) => Promise<ValidationResult>;
}

export interface SchemaDefinition {
  fieldName: string;
  validator: (value: unknown, allData: Record<string, unknown>) => Promise<string | null>;
  required: boolean;
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[] = [];
  private schemaSteps: ValidationStep[] = [];

  private constructor() {}

  private static buildPipeline(schema: { fieldName: string; validator: (value: unknown, allData: Record<string, unknown>) => Promise<string | null>; required: boolean }[]): StructuredToolInputValidationPipeline {
    const pipeline = new StructuredToolInputValidationPipeline();
    for (const schemaStep of schema) {
      pipeline.schemaSteps.push({
        name: `schema_validation_${schemaStep.fieldName}`,
        execute: async (data: Record<string, unknown>): Promise<ValidationResult> => {
          const value = data[schemaStep.fieldName];
          const errors: string[] = [];
          let isValid = true;

          if (schemaStep.required && (value === undefined || value === null || value === "")) {
            errors.push(`${schemaStep.fieldName} is required.`);
            isValid = false;
          } else if (value !== undefined && value !== null && value !== "") {
            try {
              const validationError = await schemaStep.validator(value, data);
              if (validationError) {
                errors.push(validationError);
                isValid = false;
              }
            } catch (e) {
              errors.push(`Validation failed for ${schemaStep.fieldName}: ${(e as Error).message}`);
              isValid = false;
            }
          }

          return {
            isValid: isValid && errors.length === 0,
            errors: errors,
            validatedData: { ...data }
          };
        }
      });
    }
    return pipeline;
  }

  public static create(schema: { fieldName: string; validator: (value: unknown, allData: Record<string, unknown>) => Promise<string | null>; required: boolean }[]): StructuredToolInputValidationPipeline {
    return StructuredToolInputValidationPipeline.buildPipeline(schema);
  }

  public addStep(step: ValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public addSchemaStep(schemaStep: { fieldName: string; validator: (value: unknown, allData: Record<string, unknown>) => Promise<string | null>; required: boolean }): StructuredToolInputValidationPipeline {
    this.schemaSteps.push(schemaStep);
    return this;
  }

  public async validate(inputData: Record<string, unknown>): Promise<ValidationResult> {
    let currentData: Record<string, unknown> = { ...inputData };
    let accumulatedErrors: string[] = [];
    let overallValid = true;

    // 1. Execute Schema Steps first
    for (const step of this.schemaSteps) {
      const result = await step.execute(currentData);
      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
        overallValid = false;
      }
      // Update data with validated results (though schema steps mostly check, we pass through)
      currentData = { ...currentData, ...result.validatedData };
    }

    // 2. Execute custom sequential steps
    for (const step of this.steps) {
      const result = await step.execute(currentData);
      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
        overallValid = false;
      }
      currentData = { ...currentData, ...result.validatedData };
    }

    return {
      isValid: overallValid && accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      validatedData: currentData
    };
  }
}