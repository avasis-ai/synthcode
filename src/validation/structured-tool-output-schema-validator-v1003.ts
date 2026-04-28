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

type Schema = Record<string, any>;

interface ValidatorOptions {
  targetSchema: Schema;
  fallbackSchema?: Schema;
}

interface CustomRule {
  check: (data: any, schema: Schema) => { isValid: boolean; message?: string };
}

export class StructuredToolOutputSchemaValidatorV1003 {
  private readonly targetSchema: Schema;
  private readonly fallbackSchema: Schema | undefined;
  private customRules: CustomRule[] = [];

  constructor(options: ValidatorOptions) {
    this.targetSchema = options.targetSchema;
    this.fallbackSchema = options.fallbackSchema;
  }

  registerCustomRule(rule: CustomRule): void {
    this.customRules.push(rule);
  }

  private validateAgainstSchema(data: any, schema: Schema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    // Simplified structural validation simulation
    for (const key in schema) {
      const expectedType = schema[key];
      if (typeof expectedType === 'object' && expectedType !== null && 'type' in expectedType) {
        const type = expectedType.type;
        const value = data[key];

        if (value === undefined) {
          if (schema[key].required) {
            errors.push(`Missing required field: ${key}`);
            isValid = false;
          }
        } else if (type === 'string' && typeof value !== 'string') {
          errors.push(`Field ${key} expected string, got ${typeof value}`);
          isValid = false;
        } else if (type === 'number' && typeof value !== 'number') {
          errors.push(`Field ${key} expected number, got ${typeof value}`);
          isValid = false;
        }
        // Add more complex type checking here if necessary
      }
    }

    return { isValid, errors };
  }

  private validateCustomRules(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let allValid = true;

    for (const rule of this.customRules) {
      const result = rule.check(data, this.targetSchema);
      if (!result.isValid) {
        errors.push(result.message || "Custom validation failed.");
        allValid = false;
      }
    }
    return { isValid: allValid, errors };
  }

  public validate(output: any): { isValid: boolean; errors: string[]; fallbackErrors?: string[] } {
    // 1. Validate against Target Schema
    const targetValidation = this.validateAgainstSchema(output, this.targetSchema);
    let finalErrors: string[] = [...targetValidation.errors];
    let finalIsValid = targetValidation.isValid;

    // 2. Apply Custom Rules (always run if target validation passed or failed, to report drift)
    const customValidation = this.validateCustomRules(output);
    if (!customValidation.isValid) {
      finalErrors = [...finalErrors, ...customValidation.errors];
      finalIsValid = false;
    }

    if (finalIsValid) {
      return { isValid: true, errors: [], fallbackErrors: undefined };
    }

    // 3. Fallback Validation
    if (this.fallbackSchema) {
      const fallbackValidation = this.validateAgainstSchema(output, this.fallbackSchema);
      let fallbackErrors: string[] = [...fallbackValidation.errors];

      if (fallbackValidation.isValid) {
        return {
          isValid: false,
          errors: finalErrors,
          fallbackErrors: undefined,
        };
      } else {
        return {
          isValid: false,
          errors: finalErrors,
          fallbackErrors: fallbackErrors,
        };
      }
    }

    return { isValid: false, errors: finalErrors, fallbackErrors: undefined };
  }
}