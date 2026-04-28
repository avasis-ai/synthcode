import { Message, ToolResultMessage } from "./types";

type ValidationStep = (data: Record<string, unknown>) => { isValid: boolean; error?: string };

interface SchemaDefinition {
  [key: string]: any;
}

export class StructuredToolOutputValidationPipelineBuilder {
  private schema: SchemaDefinition;
  private validationSteps: ValidationStep[] = [];

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  addCrossFieldValidator(validator: (data: Record<string, unknown>) => { isValid: boolean; error?: string }): this {
    this.validationSteps.push(validator);
    return this;
  }

  addTemporalValidator(validator: (data: Record<string, unknown>) => { isValid: boolean; error?: string }): this {
    this.validationSteps.push(validator);
    return this;
  }

  addSchemaComplianceValidator(validator: (data: Record<string, unknown>) => { isValid: boolean; error?: string }): this {
    this.validationSteps.push(validator);
    return this;
  }

  buildPipeline(): {
    execute: (data: Record<string, unknown>) => { isValid: boolean; error?: string };
  } {
    const execute = (data: Record<string, unknown>): { isValid: boolean; error?: string } => {
      for (const step of this.validationSteps) {
        const result = step(data);
        if (!result.isValid) {
          return { isValid: false, error: result.error };
        }
      }
      return { isValid: true };
    };

    return { execute };
  }
}