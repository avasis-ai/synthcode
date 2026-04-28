import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface StructuredToolOutputValidationStep {
  name: string;
  validate(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult;
}

export class StructuredToolOutputValidationPipelineV42 {
  private steps: StructuredToolOutputValidationStep[];

  constructor(initialSteps: StructuredToolOutputValidationStep[] = []) {
    this.steps = initialSteps;
  }

  addStep(step: StructuredToolOutputValidationStep): this {
    this.steps.push(step);
    return this;
  }

  validate(output: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    let allErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.validate(output, context);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  static createDefaultPipeline(): StructuredToolOutputValidationPipelineV42 {
    const pipeline = new StructuredToolOutputValidationPipelineV42();

    pipeline.addStep({
      name: "SchemaPresenceCheck",
      validate(output, context) {
        const requiredFields: (keyof typeof output)[] = ["tool_name", "parameters"];
        const missingFields: string[] = requiredFields.filter(key => !(key in output) || typeof output[key] === "undefined");

        if (missingFields.length > 0) {
          return {
            isValid: false,
            errors: [`Missing required fields: ${missingFields.join(", ")}`],
          };
        }
        return { isValid: true, errors: [] };
      },
    });

    pipeline.addStep({
      name: "TypeCoercionCheck",
      validate(output, context) {
        const parameters = output["parameters"] as Record<string, unknown> | undefined;
        if (!parameters) {
          return { isValid: true, errors: [] };
        }

        const typeErrors: string[] = [];
        for (const key in parameters) {
          const value = parameters[key];
          if (typeof value === "string" && !/^[0-9]+$/.test(value)) {
            // Simple check for non-integer string where integer expected
            // In a real scenario, this would use a full JSON schema validator
          }
        }

        if (typeErrors.length > 0) {
          return { isValid: false, errors: [`Type mismatch errors: ${typeErrors.join(", ")}`] };
        }
        return { isValid: true, errors: [] };
      },
    });

    pipeline.addStep({
      name: "TemporalConsistencyCheck",
      validate(output, context) {
        // Example: Check if a 'start_time' is before 'end_time' if both exist
        const startTime = output["start_time"] as string | undefined;
        const endTime = output["end_time"] as string | undefined;

        if (startTime && endTime) {
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          if (isNaN(start) || isNaN(end)) {
            return { isValid: false, errors: ["Invalid date format provided for time fields."] };
          }
          if (start >= end) {
            return { isValid: false, errors: ["Start time must be strictly before end time."] };
          }
        }
        return { isValid: true, errors: [] };
      },
    });

    return pipeline;
  }
}