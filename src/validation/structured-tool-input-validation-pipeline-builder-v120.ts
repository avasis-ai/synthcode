import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationStep = (input: Record<string, unknown>) => { isValid: boolean; errors: string[]; result: Record<string, unknown> };

interface ValidationPipeline {
  steps: ValidationStep[];
  parallelSteps?: ValidationStep[];
}

export class StructuredToolInputValidationPipelineBuilderV120 {
  private steps: ValidationStep[] = [];
  private parallelSteps: ValidationStep[] = [];

  private constructor() {}

  public static getInstance(): StructuredToolInputValidationPipelineBuilderV120 {
    if (!StructuredToolInputValidationPipelineBuilderV120.instance) {
      StructuredToolInputValidationPipelineBuilderV120.instance = new StructuredToolInputValidationPipelineBuilderV120();
    }
    return StructuredToolInputValidationPipelineBuilderV120.instance;
  }

  private static instance: StructuredToolInputValidationPipelineBuilderV120;

  public addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public addParallelStep(step: ValidationStep): this {
    this.parallelSteps.push(step);
    return this;
  }

  public addCrossFieldDependencyCheck(check: (input: Record<string, unknown>) => { isValid: boolean; errors: string[]; result: Record<string, unknown> }): this {
    this.steps.push(check);
    return this;
  }

  public build(): ValidationPipeline {
    const pipeline: ValidationPipeline = {
      steps: [...this.steps],
    };

    if (this.parallelSteps.length > 0) {
      pipeline.parallelSteps = [...this.parallelSteps];
    }

    return pipeline;
  }
}