import { Message, ToolResultMessage } from "./types";

export interface ValidationContext {
  inputData: Record<string, unknown>;
  history: Message[];
  metadata: Record<string, unknown>;
}

export interface StructuredToolOutputValidationStep {
  name: string;
  execute: (context: ValidationContext, data: Record<string, unknown>): { isValid: boolean; errors: string[]; context: Record<string, unknown> };
}

export class StructuredToolOutputValidationPipelineV52 {
  private steps: StructuredToolOutputValidationStep[];

  constructor(initialSteps: StructuredToolOutputValidationStep[] = []) {
    this.steps = initialSteps;
  }

  addStep(step: StructuredToolOutputValidationStep): this {
    this.steps.push(step);
    return this;
  }

  async validate(context: ValidationContext, data: Record<string, unknown>): Promise<{ isValid: boolean; errors: string[]; finalContext: Record<string, unknown> }> {
    let currentContext: ValidationContext = {
      inputData: { ...context.inputData, ...data },
      history: context.history,
      metadata: { ...context.metadata, ...data.metadata },
    };
    let accumulatedErrors: string[] = [];
    let finalContextData: Record<string, unknown> = { ...context.inputData, ...data };

    for (const step of this.steps) {
      const result = step.execute(currentContext, data);
      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
      }
      finalContextData = { ...finalContextData, ...result.context };
      currentContext.inputData = finalContextData;
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      finalContext: finalContextData,
    };
  }
}

export function buildValidationPipelineV52(
  initialSteps: StructuredToolOutputValidationStep[] = []
): StructuredToolOutputValidationPipelineV52 {
  const pipeline = new StructuredToolOutputValidationPipelineV52();
  initialSteps.forEach(step => pipeline.addStep(step));
  return pipeline;
}