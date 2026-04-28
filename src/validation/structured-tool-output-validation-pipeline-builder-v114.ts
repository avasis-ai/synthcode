import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidatorConfig {
  validator: (output: unknown) => { isValid: boolean; error?: string };
  condition?: (output: unknown) => boolean;
}

interface StepConfig {
  validator: (output: unknown) => { isValid: boolean; error?: string };
  condition?: (output: unknown) => boolean;
  onFailure?: (context: { output: unknown; error: string }) => { isValid: boolean; error?: string };
}

interface ValidationPipeline {
  steps: StepConfig[];
  validate(output: unknown): { isValid: boolean; errors: string[] };
}

class StructuredToolOutputValidationPipelineBuilder {
  private targetSchema: unknown;
  private pipelineSteps: StepConfig[] = [];

  constructor(targetSchema: unknown) {
    this.targetSchema = targetSchema;
  }

  addValidator(validator: (output: unknown) => { isValid: boolean; error?: string }): this {
    this.pipelineSteps.push({ validator, condition: undefined });
    return this;
  }

  addStep(
    validator: (output: unknown) => { isValid: boolean; error?: string },
    condition?: (output: unknown) => boolean,
    onFailure?: (context: { output: unknown; error: string }) => { isValid: boolean; error?: string }
  ): this {
    this.pipelineSteps.push({ validator, condition, onFailure });
    return this;
  }

  private buildPipeline(): ValidationPipeline {
    const steps: StepConfig[] = [];
    for (const step of this.pipelineSteps) {
      steps.push(step);
    }
    return { steps, validate: this.createValidator(steps) };
  }

  public build(): ValidationPipeline {
    return this.buildPipeline();
  }

  private createValidator(steps: StepConfig[]): (output: unknown) => { isValid: boolean; errors: string[] } {
    return (output: unknown): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      let currentOutput: unknown = output;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepIndex = i;

        if (step.condition && !step.condition(currentOutput)) {
          continue;
        }

        let validationResult: { isValid: boolean; error?: string };
        try {
          validationResult = step.validator(currentOutput);
        } catch (e) {
          validationResult = { isValid: false, error: `Runtime error during validation: ${(e as Error).message}` };
        }

        if (!validationResult.isValid) {
          const errorContext = { output: currentOutput, error: validationResult.error || "Validation failed" };
          let finalResult = validationResult;

          if (step.onFailure) {
            finalResult = step.onFailure(errorContext);
          }

          if (!finalResult.isValid) {
            errors.push(`Step ${stepIndex + 1} failed: ${finalResult.error || "Unknown failure"}`);
            // In a real scenario, failure might halt the pipeline or modify the output.
            // For simplicity, we just record the error and continue to the next step.
          }
        }
      }

      return { isValid: errors.length === 0, errors };
    };
  }
}

export { StructuredToolOutputValidationPipelineBuilder };