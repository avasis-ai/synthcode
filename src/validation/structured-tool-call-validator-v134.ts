import {
  Message,
  ToolUseBlock,
  ContentBlock,
} from "./types";

interface ToolCallSchema {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface ValidatorResult {
  isValid: boolean;
  errors: string[];
}

class StructuredToolCallValidatorV134 {
  private schemas: Map<string, ToolCallSchema>;

  constructor(schemas: ToolCallSchema[]) {
    this.schemas = new Map(schemas.map((schema) => [schema.name, schema]));
  }

  private validateToolCall(toolUse: ToolUseBlock, schema: ToolCallSchema): string[] {
    const errors: string[] = [];

    if (!schema.parameters) {
      return ["Schema for tool '" + toolUse.name + "' has no defined parameters."];
    }

    const requiredParams = Object.keys(schema.parameters.required || {});
    const providedParams = Object.keys(toolUse.input);

    for (const param of requiredParams) {
      if (!(param in toolUse.input)) {
        errors.push(`Missing required argument '${param}' for tool '${toolUse.name}'.`);
      }
    }

    for (const param of providedParams) {
      const value = toolUse.input[param];
      const paramSchema = schema.parameters.properties?.[param];

      if (!paramSchema) {
        errors.push(`Tool '${toolUse.name}' provided unknown argument '${param}'.`);
        continue;
      }

      const expectedType = paramSchema.type;
      const actualValue = value;

      if (expectedType === "string" && typeof actualValue !== "string") {
        errors.push(`Argument '${param}' for tool '${toolUse.name}' expected type 'string' but got '${typeof actualValue}'.`);
      } else if (expectedType === "number" && typeof actualValue !== "number") {
        errors.push(`Argument '${param}' for tool '${toolUse.name}' expected type 'number' but got '${typeof actualValue}'.`);
      } else if (expectedType === "boolean" && typeof actualValue !== "boolean") {
        errors.push(`Argument '${param}' for tool '${toolUse.name}' expected type 'boolean' but got '${typeof actualValue}'.`);
      }
      // Add more type checks as necessary (e.g., array, object)
    }

    return errors;
  }

  public validate(toolCalls: ToolUseBlock[]): ValidatorResult {
    const allErrors: string[] = [];

    if (!Array.isArray(toolCalls)) {
      return { isValid: false, errors: ["Input must be an array of ToolUseBlock."] };
    }

    if (toolCalls.length === 0) {
      return { isValid: true, errors: [] };
    }

    // 1. Validate each call against its schema
    for (const toolUse of toolCalls) {
      const schema = this.schemas.get(toolUse.name);
      if (!schema) {
        allErrors.push(`No schema found for tool name: '${toolUse.name}'.`);
        continue;
      }

      const callErrors = this.validateToolCall(toolUse, schema);
      allErrors.push(...callErrors);
    }

    // 2. Cross-call validation (Example: Check for unique tool use IDs)
    const usedIds = new Set<string>();
    for (const toolUse of toolCalls) {
      if (usedIds.has(toolUse.id)) {
        allErrors.push(`Duplicate tool use ID found: '${toolUse.id}'. All tool use IDs must be unique.`);
      }
      usedIds.add(toolUse.id);
    }

    // 3. Cross-call validation (Example: Check for mutually exclusive calls - Placeholder)
    // In a real scenario, this would involve complex logic based on the tool definitions.
    // For this implementation, we'll just check if more than one call is made when only one is expected.
    // if (toolCalls.length > 1 && this.schemas.get('single_action_tool')) {
    //     allErrors.push("Multiple tool calls detected, but the context suggests only one action is appropriate.");
    // }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

export { StructuredToolCallValidatorV134 };