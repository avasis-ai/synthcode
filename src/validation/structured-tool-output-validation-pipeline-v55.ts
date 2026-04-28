import { Message, ToolResultMessage } from "./types";

interface ValidationContext {
  history: Message[];
  toolOutput: Record<string, unknown>;
  timestamp: number;
}

interface ValidationStep {
  validate(context: ValidationContext, output: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

class StructuredToolOutputValidationPipeline {
  private steps: ValidationStep[];

  constructor(initialSteps: ValidationStep[] = []) {
    this.steps = initialSteps;
  }

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  private executeStep(context: ValidationContext, output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    for (const step of this.steps) {
      const result = step.validate(context, output);
      if (!result.isValid) {
        return { isValid: false, errors: [...(result as any).errors] };
      }
    }
    return { isValid: true, errors: [] };
  }

  public validate(context: ValidationContext, output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    return this.executeStep(context, output);
  }

  public static create(initialSteps: ValidationStep[] = []): StructuredToolOutputValidationPipeline {
    return new StructuredToolOutputValidationPipeline(initialSteps);
  }
}

class SchemaValidationStep implements ValidationStep {
  private schema: Record<string, any>;

  constructor(schema: Record<string, any>) {
    this.schema = schema;
  }

  validate(context: ValidationContext, output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    for (const key in this.schema) {
      const expectedType = this.schema[key].type;
      const value = output[key];

      if (value === undefined) {
        if (this.schema[key].required) {
          errors.push(`Missing required field: ${key}`);
          isValid = false;
        }
        continue;
      }

      if (expectedType === "string" && typeof value !== "string") {
        errors.push(`Field ${key} expected string, got ${typeof value}`);
        isValid = false;
      } else if (expectedType === "number" && typeof value !== "number") {
        errors.push(`Field ${key} expected number, got ${typeof value}`);
        isValid = false;
      }
      // Add more type checks as needed
    }

    return { isValid, errors };
  }
}

class CrossFieldTemporalStep implements ValidationStep {
  validate(context: ValidationContext, output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    // Example: If 'action_type' is 'update', 'updated_at' must be within 5 minutes of context timestamp
    const actionType = output.action_type as string | undefined;
    const updatedAt = output.updated_at as number | undefined;

    if (actionType === "update" && updatedAt) {
      const timeDifference = Math.abs(context.timestamp - updatedAt);
      const fiveMinutesMs = 5 * 60 * 1000;

      if (timeDifference > fiveMinutesMs) {
        errors.push(`Temporal violation: Update time (${updatedAt}) is too far from context time (${context.timestamp}).`);
        isValid = false;
      }
    }

    return { isValid, errors };
  }
}

export {
  StructuredToolOutputValidationPipeline,
  SchemaValidationStep,
  CrossFieldTemporalStep
};