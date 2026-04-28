import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // Simplified representation of JSON Schema for parameters
}

export interface Context {
  // Placeholder for context data, e.g., previous messages, session state
  [key: string]: unknown;
}

export interface Schema {
  type: string;
  properties: Record<string, any>;
  required: string[];
}

export interface ResolutionError {
  field: string;
  reason: "MISSING_CONTEXT" | "AMBIGUOUS" | "INVALID_TYPE";
  message: string;
}

export class SchemaResolver {
  private readonly toolDefinitions: Map<string, ToolDefinition>;

  constructor(toolDefinitions: ToolDefinition[]) {
    this.toolDefinitions = new Map(
      toolDefinitions.map((def) => [def.name, def])
    );
  }

  private extractContextValue(context: Context, fieldName: string): unknown | null {
    if (context[fieldName] !== undefined) {
      return context[fieldName];
    }
    return null;
  }

  private validateAndCoerce(
    fieldName: string,
    schema: any,
    context: Context,
  ): { value: unknown; error: ResolutionError | null } {
    const required = schema.required && schema.required.includes(fieldName);
    const contextValue = this.extractContextValue(context, fieldName);

    if (required && contextValue === null) {
      return {
        value: null,
        error: {
          field: fieldName,
          reason: "MISSING_CONTEXT",
          message: `Required parameter '${fieldName}' is missing from the context.`,
        },
      };
    }

    if (contextValue === null) {
      return { value: null, error: null };
    }

    // Basic type checking/coercion simulation
    if (schema.type === "string" && typeof contextValue !== "string") {
      try {
        const coerced = String(contextValue);
        return { value: coerced, error: null };
      } catch (e) {
        return {
          value: null,
          error: {
            field: fieldName,
            reason: "INVALID_TYPE",
            message: `Cannot coerce context value '${contextValue}' to string.`,
          },
        };
      }
    }

    // Assume successful resolution for other types for simplicity
    return { value: contextValue, error: null };
  }

  resolve(
    toolName: string,
    requiredSchema: Schema,
    context: Context,
  ): { input: Record<string, unknown>; errors: ResolutionError[] } {
    const toolDef = this.toolDefinitions.get(toolName);
    if (!toolDef) {
      throw new Error(`Tool definition not found for name: ${toolName}`);
    }

    const input: Record<string, unknown> = {};
    const errors: ResolutionError[] = [];

    const properties = requiredSchema.properties || {};
    const requiredFields = requiredSchema.required || [];

    for (const fieldName of requiredFields) {
      const schema = properties[fieldName];
      if (!schema) continue;

      const { value, error } = this.validateAndCoerce(
        fieldName,
        schema,
        context,
      );

      if (error) {
        errors.push(error);
      } else {
        input[fieldName] = value;
      }
    }

    return { input, errors };
  }
}