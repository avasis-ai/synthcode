import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

type ValidationStep = (context: Record<string, unknown>, data: unknown) => {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

interface ValidationStepType {
  name: string;
  validator: (context: Record<string, unknown>, data: unknown) => {
    isValid: boolean;
    errors: string[];
    context: Record<string, unknown>;
  };
}

class StructuredToolOutputValidationPipelineBuilder {
  private steps: ValidationStepType[] = [];

  addStep(stepType: ValidationStepType): this {
    this.steps.push(stepType);
    return this;
  }

  build(): (data: unknown) => {
    return (data: unknown): { isValid: boolean; errors: string[]; finalContext: Record<string, unknown> } => {
      let context: Record<string, unknown> = {};
      let allErrors: string[] = [];

      for (const step of this.steps) {
        try {
          const result = step.validator(context, data);
          if (!result.isValid) {
            allErrors.push(...result.errors);
          }
          context = result.context;
        } catch (e) {
          allErrors.push(`Execution error in ${step.name}: ${(e as Error).message}`);
          // Stop processing on critical error for simplicity in this builder pattern
          break;
        }
      }

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        finalContext: context,
      };
    };
  }
}

export { StructuredToolOutputValidationPipelineBuilder };