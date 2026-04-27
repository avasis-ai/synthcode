import { z, ZodError } from "zod";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ToolOutputSchemaValidator {
  private readonly schema: z.ZodTypeAny;

  constructor(schema: z.ZodTypeAny) {
    this.schema = schema;
  }

  public validate(output: unknown): ValidationResult {
    try {
      this.schema.parse(output);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) =>
          `${e.path.join('.')}: ${e.message}`
        );
        return { isValid: false, errors: errorMessages };
      }
      return { isValid: false, errors: ["Unknown validation error occurred."] };
    }
  }
}

export function createToolOutputValidator(schema: z.ZodTypeAny): ToolOutputSchemaValidator {
  return new ToolOutputSchemaValidator(schema);
}