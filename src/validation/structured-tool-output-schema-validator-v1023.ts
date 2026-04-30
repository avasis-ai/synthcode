import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ValidationContext {
  messages: Message[];
  schema: Record<string, any>;
  // Add context for cross-field/temporal validation if needed
  history: any[];
}

export interface StructuredValidator<T> {
  validate(data: T, context: ValidationContext): { isValid: boolean; errors: string[] };
}

export interface ValidationStep {
  execute: (data: any, context: ValidationContext) => { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputSchemaValidatorV1023 implements StructuredValidator<any> {
  private steps: ValidationStep[];

  constructor() {
    this.steps = [
      {
        execute: (data, context) => {
          // Step 1: Basic Field Validation (Schema adherence)
          const errors: string[] = [];
          const schema = context.schema;

          if (!schema) {
            return { isValid: false, errors: ["Schema definition is missing."] };
          }

          // Simplified check: assumes 'data' structure matches schema keys
          for (const key in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, key)) {
              const expectedType = schema[key].type;
              const value = data[key];

              if (value === undefined) {
                if (schema[key].required) {
                  errors.push(`Field '${key}' is required but missing.`);
                }
                continue;
              }

              // Type checking simulation
              const actualType = typeof value;
              if (expectedType && expectedType !== "any" && actualType !== expectedType) {
                errors.push(`Field '${key}' expected type '${expectedType}', but got '${actualType}'.`);
              }
            }
          }
          return { isValid: errors.length === 0, errors };
        }
      },
      {
        execute: (data, context) => {
          // Step 2: Cross-Field Dependency Validation
          const errors: string[] = [];
          const schema = context.schema;

          // Example: If 'output_type' is 'A', then 'required_id' must be present.
          if (schema?.output_type === "A" && !data.required_id) {
            errors.push("Cross-field validation failed: If output_type is 'A', 'required_id' must be provided.");
          }

          // Example: Check relationship between two fields
          if (schema?.input_data && typeof data.input_data === 'object' && data.input_data !== null) {
            if (data.input_data.source_id && data.source_id !== data.input_data.source_id) {
                errors.push("Cross-field validation failed: source_id mismatch between root and input_data.");
            }
          }

          return { isValid: errors.length === 0, errors };
        }
      },
      {
        execute: (data, context) => {
          // Step 3: Temporal Constraint Validation (Requires history context)
          const errors: string[] = [];
          const messages = context.messages;

          // Example: Ensure the tool output references a message that occurred within the last 5 turns.
          if (data.tool_reference_id) {
            const recentMessages = messages.slice(-5);
            const found = recentMessages.some(msg => {
              if (msg.role === "tool" && msg.tool_use_id === data.tool_reference_id) {
                return true;
              }
              return false;
            });
            if (!found) {
              errors.push("Temporal validation failed: tool_reference_id references an event older than the last 5 turns.");
            }
          }

          return { isValid: errors.length === 0, errors };
        }
      }
    ];
  }

  validate(data: any, context: ValidationContext): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step.execute(data, context);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}