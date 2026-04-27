import { z } from "zod";

export type ValidationError = {
  path: string;
  message: string;
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class SchemaValidator {
  private readonly schema: z.ZodTypeAny;

  constructor(schema: z.ZodTypeAny) {
    this.schema = schema;
  }

  validate(input: any): ValidationResult {
    const result = this.schema.safeParse(input);

    if (result.success) {
      return { isValid: true, errors: [] };
    } else {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        path: err.path.join("."),
        message: err.message,
      }));
      return { isValid: false, errors: errors };
    }
  }
}