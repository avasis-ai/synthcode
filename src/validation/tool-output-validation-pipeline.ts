import { z, ZodError } from "zod";

export interface ValidationResult {
  isValid: boolean;
  finalOutput: any;
  errors: string[];
}

export interface ValidationStep {
  validate(input: any): {
    isValid: boolean;
    output: any;
    error?: string;
  };
}

export class ToolOutputValidationPipeline {
  private steps: ValidationStep[];
  private schema: z.ZodTypeAny;

  constructor(steps: ValidationStep[], schema: z.ZodTypeAny) {
    this.steps = steps;
    this.schema = schema;
  }

  private validateAgainstSchema(input: any): {
    isValid: boolean;
    output: any;
    error?: string;
  } {
    try {
      const parsed = this.schema.parse(input);
      return {
        isValid: true,
        output: parsed,
      };
    } catch (e) {
      if (e instanceof z.ZodError) {
        return {
          isValid: false,
          output: input,
          error: `Schema validation failed: ${e.errors.map(err => err.message).join(", ")}`,
        };
      }
      return {
        isValid: false,
        output: input,
        error: `Unknown validation error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  public run(input: any): ValidationResult {
    let currentOutput: any = input;
    let allErrors: string[] = [];

    // 1. Schema Validation (Initial check)
    const schemaValidation = this.validateAgainstSchema(input);
    if (!schemaValidation.isValid) {
      allErrors.push(schemaValidation.error || "Initial schema validation failed.");
    }
    currentOutput = schemaValidation.output;

    // 2. Sequential Step Validation
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const result = step.validate(currentOutput);

      if (!result.isValid) {
        allErrors.push(`Step ${i} failed: ${result.error || "Validation failed."}`);
        // Stop processing on failure to prevent cascading errors,
        // but keep the last known output for debugging.
        currentOutput = result.output;
        break;
      }
      currentOutput = result.output;
    }

    const finalIsValid = allErrors.length === 0;

    return {
      isValid: finalIsValid,
      finalOutput: currentOutput,
      errors: allErrors,
    };
  }
}