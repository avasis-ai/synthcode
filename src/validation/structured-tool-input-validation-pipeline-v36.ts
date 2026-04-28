import { Message, ContentBlock, ToolUseBlock } from "./types";

interface ValidationContext {
  messages: Message[];
  toolInputs: Record<string, unknown>;
}

interface ValidationStep {
  name: string;
  validate: (context: ValidationContext, inputs: Record<string, unknown>) => Promise<void>;
  dependencyCheck?: (context: ValidationContext, inputs: Record<string, unknown>) => Promise<void>;
}

class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  private async executeStep(step: ValidationStep, context: ValidationContext, inputs: Record<string, unknown>): Promise<void> {
    if (step.dependencyCheck) {
      await step.dependencyCheck(context, inputs);
    }
    await step.validate(context, inputs);
  }

  public async validate(context: ValidationContext, inputs: Record<string, unknown>): Promise<void> {
    for (const step of this.steps) {
      await this.executeStep(step, context, inputs);
    }
  }
}

export function buildValidationPipeline(steps: ValidationStep[]): StructuredToolInputValidationPipeline {
  return new StructuredToolInputValidationPipeline(steps);
}

export {
  StructuredToolInputValidationPipeline,
  buildValidationPipeline,
  ValidationStep,
  ValidationContext
}