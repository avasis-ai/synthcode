import { z, ZodError } from "zod";

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, any>; // Simplified for schema generation
};

export interface ToolCallValidator {
  validateCall(call: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

export class ToolCallValidatorImpl implements ToolCallValidator {
  private readonly schema: z.ZodTypeAny;

  constructor(toolDefinition: ToolDefinition, schema: z.ZodTypeAny) {
    this.schema = schema;
  }

  validateCall(call: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    try {
      this.schema.parse(call);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages: string[] = error.errors.map(e =>
          `${e.path.join('.')}: ${e.message}`
        );
        return { isValid: false, errors: errorMessages };
      }
      return { isValid: false, errors: ["Unknown validation error occurred."] };
    }
  }
}

export function createToolCallValidator(
  toolDefinition: ToolDefinition,
  schema: z.ZodTypeAny
): ToolCallValidator {
  return new ToolCallValidatorImpl(toolDefinition, schema);
}

export function validateToolCall(
  toolDefinition: ToolDefinition,
  schema: z.ZodTypeAny,
  call: Record<string, unknown>
): { isValid: boolean; errors: string[] } {
  const validator = createToolCallValidator(toolDefinition, schema);
  return validator.validateCall(call);
}