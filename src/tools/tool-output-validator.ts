import {
  ToolResultMessage,
  Message,
} from "./types";

interface SchemaValidator<T> {
  (data: unknown): { isValid: boolean; errors: string[] };
}

export class ToolOutputValidator {
  private readonly validator: SchemaValidator<any>;

  constructor(validator: SchemaValidator<any>) {
    this.validator = validator;
  }

  public validate(
    toolOutput: ToolResultMessage,
    schema: SchemaValidator<any>
  ): { isValid: boolean; errors: string[]; validatedData: Partial<ToolResultMessage> } {
    const validationResult = schema(toolOutput);

    if (!validationResult.isValid) {
      return {
        isValid: false,
        errors: validationResult.errors,
        validatedData: {}
      };
    }

    return {
      isValid: true,
      errors: [],
      validatedData: {
        tool_use_id: toolOutput.tool_use_id,
        content: toolOutput.content,
        is_error: toolOutput.is_error
      }
    };
  }

  public static createDefaultValidator(): ToolOutputValidator {
    const defaultValidator: SchemaValidator<any> = (data: unknown) => {
      const result = {
        isValid: true,
        errors: []
      };

      if (typeof data !== 'object' || data === null) {
        result.isValid = false;
        result.errors.push("Tool output must be a non-null object.");
        return result;
      }

      const toolOutput = data as ToolResultMessage;

      if (!toolOutput.tool_use_id || typeof toolOutput.tool_use_id !== 'string') {
        result.isValid = false;
        result.errors.push("Missing or invalid 'tool_use_id'.");
      }

      if (typeof toolOutput.content !== 'string' || toolOutput.content.trim().length === 0) {
        result.isValid = false;
        result.errors.push("Missing or empty 'content'.");
      }

      if (toolOutput.is_error !== undefined && typeof toolOutput.is_error !== 'boolean') {
        result.isValid = false;
        result.errors.push("'is_error' must be a boolean.");
      }

      return result;
    };

    return new ToolOutputValidator(defaultValidator);
  }
}