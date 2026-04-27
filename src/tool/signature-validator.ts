import { z, ZodError } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType<any>;
}

export interface SignatureValidator {
  validate(
    definition: ToolDefinition,
    args: Record<string, unknown>
  ): { isValid: boolean; error?: string };
}

export class ToolSignatureValidator implements SignatureValidator {
  validate(
    definition: ToolDefinition,
    args: Record<string, unknown>
  ): { isValid: boolean; error?: string } {
    try {
      definition.parameters.parse(args);
      return { isValid: true };
    } catch (e) {
      if (e instanceof z.ZodError) {
        const errorDetails = e.errors.map(err => {
          return `${err.path.join('.')}: ${err.message}`;
        }).join("; ");
        return {
          isValid: false,
          error: `Argument validation failed for tool '${definition.name}'. Details: ${errorDetails}`,
        };
      }
      return {
        isValid: false,
        error: `An unexpected validation error occurred for tool '${definition.name}'.`,
      };
    }
  }
}

export const createSignatureValidator = (): SignatureValidator => {
  return new ToolSignatureValidator();
};