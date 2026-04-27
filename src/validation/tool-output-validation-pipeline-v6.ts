import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidatorStep {
  validate(output: Record<string, unknown>): ValidationResult;
}

export class TemporalConstraintValidator implements ValidatorStep {
  validate(output: Record<string, unknown>): ValidationResult {
    const results: string[] = [];
    const startTime = output.startTime as ? (output.startTime as Date).getTime() : null;
    const endTime = output.endTime as ? (output.endTime as Date).getTime() : null;

    if (startTime && endTime && startTime > endTime) {
      results.push("Temporal constraint failed: startTime cannot be after endTime.");
    }
    return {
      isValid: results.length === 0,
      errors: results,
    };
  }
}

export class ConditionalLogicValidator implements ValidatorStep {
  private readonly condition: (data: Record<string, unknown>) => boolean;
  private readonly error: string;

  constructor(condition: (data: Record<string, unknown>) => boolean, error: string) {
    this.condition = condition;
    this.error = error;
  }

  validate(output: Record<string, unknown>): ValidationResult {
    if (!this.condition(output)) {
      return {
        isValid: false,
        errors: [`Conditional logic failed: ${this.error}`],
      };
    }
    return { isValid: true, errors: [] };
  }
}

export class ToolOutputValidationPipelineV6 {
  private readonly steps: ValidatorStep[];

  constructor(steps: ValidatorStep[] = []) {
    this.steps = steps;
  }

  addStep(step: ValidatorStep): this {
    this.steps.push(step);
    return this;
  }

  runValidation(output: Record<string, unknown>): ValidationResult {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const step of this.steps) {
      const result = step.validate(output);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
        overallValid = false;
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}

export const createToolOutputValidationPipelineV6 = (): ToolOutputValidationPipelineV6 => {
  const pipeline = new ToolOutputValidationPipelineV6();

  // 1. Basic Schema Validation Placeholder (Assuming this happens before the pipeline)
  // In a real scenario, this would integrate a JSON Schema validator.
  // For this implementation, we focus on the advanced steps.

  // 2. Add Temporal Constraint Validator
  pipeline.addStep(new TemporalConstraintValidator());

  // 3. Add Conditional Logic Validator Example
  // Example: If 'status' is 'completed', then 'durationMs' must be present and positive.
  const conditionalStep = new ConditionalLogicValidator(
    (data) => {
      const status = data.status as string;
      const duration = data.durationMs as number;
      return status === "completed" ? typeof duration === "number" && duration >= 0 : true;
    },
    "If status is 'completed', durationMs must be a non-negative number."
  );
  pipeline.addStep(conditionalStep);

  return pipeline;
};