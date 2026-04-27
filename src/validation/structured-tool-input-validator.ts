import { z, ZodError } from "zod";

export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
}

type ValidatorFunction = (data: Record<string, unknown>) => ValidationError[] | null;

export class StructuredToolInputValidator {
  private schema: z.ZodType<any>;
  private customValidators: Map<string, ValidatorFunction>;

  constructor(schema: z.ZodType<any>, customValidators: Record<string, ValidatorFunction> = {}) {
    this.schema = schema;
    this.customValidators = new Map(
      Object.entries(customValidators).map(([key, validator]) => [key, validator])
    );
  }

  private validateSchema(data: Record<string, unknown>): ValidationError[] {
    try {
      this.schema.parse(data);
      return [];
    } catch (e) {
      if (e instanceof z.ZodError) {
        return this.mapZodError(e);
      }
      return [{ field: "root", message: "Unknown validation error", code: "UNKNOWN" }];
    }
  }

  private mapZodError(error: z.ZodError): ValidationError[] {
    return error.errors.map(e => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));
  }

  private validateCustomRules(data: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const [field, validator] of this.customValidators.entries()) {
      const fieldErrors = validator(data);
      if (fieldErrors) {
        errors.push(...fieldErrors);
      }
    }
    return errors;
  }

  public validate(input: Record<string, unknown>): ValidationReport {
    const schemaErrors = this.validateSchema(input);
    const customErrors = this.validateCustomRules(input);

    const allErrors: ValidationError[] = [...schemaErrors, ...customErrors];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}