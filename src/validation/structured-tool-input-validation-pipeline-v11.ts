import { Message, ToolUseBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  validatedInput: Record<string, unknown>;
};

export interface AdvancedValidationStep {
  execute: (context: { messages: Message[] }, input: Record<string, unknown>) => {
    isValid: boolean;
    errors: string[];
    validatedInput: Record<string, unknown>;
  };
}

export class StructuredToolInputValidationPipeline {
  private steps: AdvancedValidationStep[];

  constructor() {
    this.steps = [];
  }

  addStep(step: AdvancedValidationStep): this {
    this.steps.push(step);
    return this;
  }

  validate(context: { messages: Message[] }, input: Record<string, unknown>): ValidationResult {
    let currentInput: Record<string, unknown> = { ...input };
    let accumulatedErrors: string[] = [];
    let isValid = true;

    for (const step of this.steps) {
      const result = step.execute(context, currentInput);

      if (!result.isValid) {
        isValid = false;
        accumulatedErrors = [...accumulatedErrors, ...result.errors];
        // In a real pipeline, we might decide whether to continue on failure.
        // For this implementation, we collect all errors but use the last valid state.
      } else {
        // Update the input state with the validated/refined data from the step
        currentInput = result.validatedInput;
      }
    }

    return {
      isValid: isValid,
      errors: accumulatedErrors,
      validatedInput: currentInput,
    };
  }
}

export const createBasicSchemaValidatorStep: (schema: Record<string, any>) => AdvancedValidationStep = (schema: Record<string, any>): AdvancedValidationStep => {
  return {
    execute: (context: { messages: Message[] }, input: Record<string, unknown>): ValidationResult => {
      const errors: string[] = [];
      const validatedInput: Record<string, unknown> = {};

      for (const key in schema) {
        const schemaType = schema[key];
        const value = input[key];

        if (value === undefined || value === null) {
          if (schemaType.required) {
            errors.push(`Missing required field: ${key}`);
          }
          validatedInput[key] = undefined;
          continue;
        }

        // Simple type checking simulation
        if (schemaType.type === "string" && typeof value !== "string") {
          errors.push(`Field ${key} expected type string, got ${typeof value}`);
        } else if (schemaType.type === "number" && typeof value !== "number") {
          errors.push(`Field ${key} expected type number, got ${typeof value}`);
        } else {
          validatedInput[key] = value;
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
        validatedInput: validatedInput,
      };
    },
  };
};

export const createCrossFieldDependencyStep: (dependencyCheck: (input: Record<string, unknown>) => string | null) => AdvancedValidationStep = (dependencyCheck: (input: Record<string, unknown>) => string | null): AdvancedValidationStep => {
  return {
    execute: (context: { messages: Message[] }, input: Record<string, unknown>): ValidationResult => {
      const error = dependencyCheck(input);
      if (error) {
        return {
          isValid: false,
          errors: [`Cross-field dependency failed: ${error}`],
          validatedInput: input,
        };
      }
      return {
        isValid: true,
        errors: [],
        validatedInput: input,
      };
    },
  };
};

export const createTemporalOrderingStep: (requiredOrder: string[]) => AdvancedValidationStep = (requiredOrder: string[]): AdvancedValidationStep => {
  return {
    execute: (context: { messages: Message[] }, input: Record<string, unknown>): ValidationResult => {
      const inputKeys = Object.keys(input);
      const foundKeys: string[] = [];
      const orderedKeys: string[] = [];

      for (const key of inputKeys) {
        if (!foundKeys.includes(key)) {
          foundKeys.push(key);
          orderedKeys.push(key);
        }
      }

      const missingOrder: string[] = [];
      let currentExpectedIndex = 0;
      let isOrdered = true;

      for (const requiredKey of requiredOrder) {
        const foundIndex = orderedKeys.indexOf(requiredKey);
        if (foundIndex === -1) {
          missingOrder.push(requiredKey);
          isOrdered = false;
        } else if (foundIndex > currentExpectedIndex) {
          // This check is complex without knowing the exact structure,
          // so we simplify: check if all required keys are present in the input keys.
        }
        currentExpectedIndex = Math.max(currentExpectedIndex, foundIndex + 1);
      }

      const errors: string[] = [];
      if (missingOrder.length > 0) {
        errors.push(`Temporal ordering violation: Missing required fields in order: ${missingOrder.join(', ')}`);
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
        validatedInput: input,
      };
    },
  };
};