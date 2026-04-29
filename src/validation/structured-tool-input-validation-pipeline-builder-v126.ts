import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  data: Record<string, unknown>;
};

type ValidatorFunction = (data: Record<string, unknown>) => ValidationResult;

interface ValidationStep {
  execute: (data: Record<string, unknown>) => ValidationResult;
}

class StructuredToolInputValidationPipelineBuilder {
  private schema: Record<string, any>;
  private steps: ValidationStep[] = [];

  constructor(schema: Record<string, any>) {
    this.schema = schema;
  }

  private addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public addRequiredFieldStep(fieldName: string): this {
    const step: ValidationStep = {
      execute: (data: Record<string, unknown>): ValidationResult => {
        const errors: string[] = [];
        if (!(fieldName in data) || data[fieldName] === null || data[fieldName] === undefined) {
          errors.push(`Required field '${fieldName}' is missing or null.`);
        }
        return { isValid: errors.length === 0, errors, data };
      },
    };
    return this.addStep(step);
  }

  public addTypeCheckStep(fieldName: string, expectedType: "string" | "number" | "boolean"): this {
    const step: ValidationStep = {
      execute: (data: Record<string, unknown>): ValidationResult => {
        const errors: string[] = [];
        const value = data[fieldName];
        if (value === undefined || value === null) {
          return { isValid: true, errors: [], data };
        }

        let actualType: "string" | "number" | "boolean" = "unknown";
        if (typeof value === "string") {
          actualType = "string";
        } else if (typeof value === "number") {
          actualType = "number";
        } else if (typeof value === "boolean") {
          actualType = "boolean";
        }

        if (actualType !== expectedType) {
          errors.push(`Field '${fieldName}' expected type ${expectedType}, but got ${actualType}.`);
        }
        return { isValid: errors.length === 0, errors, data };
      },
    };
    return this.addStep(step);
  }

  public addCrossFieldValidatorStep(
    condition: (data: Record<string, unknown>) => boolean,
    errorMessage: string
  ): this {
    const step: ValidationStep = {
      execute: (data: Record<string, unknown>): ValidationResult => {
        if (condition(data)) {
          return { isValid: true, errors: [], data };
        } else {
          return { isValid: false, errors: [errorMessage], data };
        }
      },
    };
    return this.addStep(step);
  }

  public build(): {
    validate: (data: Record<string, unknown>) => ValidationResult;
  } {
    const pipeline: (data: Record<string, unknown>) => ValidationResult = (data: Record<string, unknown>): ValidationResult => {
      let currentData: Record<string, unknown> = { ...data };
      let overallValid = true;
      const allErrors: string[] = [];

      for (const step of this.steps) {
        const result = step.execute(currentData);
        if (!result.isValid) {
          overallValid = false;
          allErrors.push(...result.errors);
        }
        // Update data state for subsequent steps, even if validation fails
        currentData = { ...result.data };
      }

      return {
        isValid: overallValid,
        errors: allErrors,
        data: currentData,
      };
    };

    return { validate: pipeline };
  }
}

export { StructuredToolInputValidationPipelineBuilder };