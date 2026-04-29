import {
  ToolCall,
  ToolDefinition,
  ToolRegistry,
} from "./tool-call-types";

type ValidationError = {
  field: string;
  message: string;
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class ToolCallValidator {
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  private validateToolName(toolCall: ToolCall): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!this.toolRegistry.has(toolCall.name)) {
      errors.push({
        field: "name",
        message: `Tool "${toolCall.name}" is not registered.`,
      });
    }
    return errors;
  }

  private validateArguments(
    toolCall: ToolCall,
    toolDefinition: ToolDefinition
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const schema = toolDefinition.parameters;

    if (!schema) {
      return [];
    }

    const requiredArgs = Object.keys(schema.properties || {}) as (keyof typeof schema.properties)[];

    for (const argName of requiredArgs) {
      const propSchema = schema.properties![argName];
      const value = toolCall.input?.[argName];

      if (propSchema.required && value === undefined) {
        errors.push({
          field: `input.${argName}`,
          message: `${argName} is required but missing.`,
        });
        continue;
      }

      if (value !== undefined) {
        // Basic type checking simulation
        const expectedType = propSchema.type;
        const actualValue = value;

        switch (expectedType) {
          case "string":
            if (typeof actualValue !== "string") {
              errors.push({
                field: `input.${argName}`,
                message: `Expected type 'string', but got ${typeof actualValue}.`,
              });
            }
            break;
          case "number":
            if (typeof actualValue !== "number") {
              errors.push({
                field: `input.${argName}`,
                message: `Expected type 'number', but got ${typeof actualValue}.`,
              });
            }
            break;
          case "boolean":
            if (typeof actualValue !== "boolean") {
              errors.push({
                field: `input.${argName}`,
                message: `Expected type 'boolean', but got ${typeof actualValue}.`,
              });
            }
            break;
          default:
            // Complex type validation omitted for brevity, focusing on structure
            break;
        }
      }
    }

    return errors;
  }

  public validate(toolCall: ToolCall): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. Validate Tool Name Existence
    errors.push(...this.validateToolName(toolCall));

    // 2. Validate Arguments Structure (only if name is valid)
    if (this.toolRegistry.has(toolCall.name)) {
      const toolDefinition = this.toolRegistry.get(toolCall.name)!;
      errors.push(...this.validateArguments(toolCall, toolDefinition));
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}