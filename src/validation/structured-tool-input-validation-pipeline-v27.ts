import { Message } from "./types";

type ConstraintResolver = (
  input: Record<string, unknown>
) => { isValid: boolean; message?: string };

export interface ValidationStep {
  validate: (input: Record<string, unknown>) => { isValid: boolean; message?: string };
  resolver?: (input: Record<string, unknown>) => { isValid: boolean; message?: string };
}

export class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): {
    validate: (input: Record<string, unknown>) => { isValid: boolean; message?: string };
  } {
    return {
      validate: (input: Record<string, unknown>): { isValid: boolean; message?: string } => {
        for (const step of this.steps) {
          // 1. Run basic validation step
          const basicValidation = step.validate ? step.validate(input) : { isValid: true };
          if (!basicValidation.isValid) {
            return { isValid: false, message: basicValidation.message };
          }

          // 2. Run advanced constraint resolver if available
          if (step.resolver) {
            const resolved = step.resolver(input);
            if (!resolved.isValid) {
              return { isValid: false, message: resolved.message };
            }
          }
        }
        return { isValid: true };
      },
    };
  }
}

export const createStructuredToolInputValidationPipeline = (): {
  validate: (input: Record<string, unknown>) => { isValid: boolean; message?: string };
} => {
  const builder = new StructuredToolInputValidationPipelineBuilder();

  // Example Step 1: Basic required field check (e.g., 'tool_name')
  builder.addStep({
    validate: (input: Record<string, unknown>) => {
      if (!input["tool_name"] || typeof input["tool_name"] !== "string") {
        return { isValid: false, message: "Tool name is required and must be a string." };
      }
      return { isValid: true };
    },
  });

  // Example Step 2: Cross-field dependency check (e.g., date ordering)
  builder.addStep({
    validate: (input: Record<string, unknown>) => {
      // This step only performs basic validation, relying on the resolver for complexity
      return { isValid: true };
    },
    resolver: (input: Record<string, unknown>) => {
      const startDate = input["start_date"];
      const endDate = input["end_date"];

      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        if (isNaN(start) || isNaN(end)) {
          return { isValid: false, message: "Start and end dates must be valid dates." };
        }

        if (end < start) {
          return { isValid: false, message: "End date must be after the start date." };
        }
      }
      return { isValid: true };
    },
  });

  // Example Step 3: Conditional presence check (e.g., if 'mode' is 'advanced', 'config' must exist)
  builder.addStep({
    validate: (input: Record<string, unknown>) => {
      return { isValid: true };
    },
    resolver: (input: Record<string, unknown>) => {
      const mode = input["mode"] as string | undefined;
      const config = input["config"];

      if (mode === "advanced" && (!config || typeof config !== "object")) {
        return { isValid: false, message: "Advanced mode requires a non-null 'config' object." };
      }
      return { isValid: true };
    },
  });

  return builder.build();
};