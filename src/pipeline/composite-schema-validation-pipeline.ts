import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface SchemaValidator {
  validate(data: unknown): { isValid: boolean; errors: string[] };
}

export class CompositeSchemaValidator {
  private readonly schemas: SchemaValidator[];
  private readonly context: {
    // Placeholder for any necessary context data
  };

  constructor(schemas: SchemaValidator[], context: {
    // Placeholder for context
  }) {
    this.schemas = schemas;
    this.context = context;
  }

  private validateSingle(data: unknown): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let allValid = true;

    for (const schemaValidator of this.schemas) {
      const result = schemaValidator.validate(data);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
    };
  }

  public validate(toolOutput: ToolResultMessage): { isValid: boolean; errors: string[] } {
    // Assuming the content string needs to be validated against the composite schema
    const dataToValidate = JSON.parse(toolOutput.content);

    return this.validateSingle(dataToValidate);
  }

  public async validateBatch(toolOutputs: ToolResultMessage[]): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    let allErrors: string[] = [];
    let allValid = true;

    for (const toolOutput of toolOutputs) {
      const result = this.validate(toolOutput);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
    };
  }
}