import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  data: Record<string, unknown>;
};

type ValidationStep = (input: Record<string, unknown>) => ValidationResult;

type Condition = (input: Record<string, unknown>) => boolean;

interface PipelineContext {
  initialInput: Record<string, unknown>;
  currentData: Record<string, unknown>;
}

class ValidationPipeline {
  private steps: {
    condition: Condition;
    step: ValidationStep;
  }[];

  constructor(steps: {
    condition: Condition;
    step: ValidationStep;
  }[] = []) {
    this.steps = steps;
  }

  execute(initialInput: Record<string, unknown>): ValidationResult {
    let context: PipelineContext = {
      initialInput: initialInput,
      currentData: { ...initialInput },
    };

    for (const { condition, step } of this.steps) {
      if (!condition(context.initialInput)) {
        continue;
      }

      const result = step(context.currentData);
      if (!result.isValid) {
        // In a real scenario, we might stop or aggregate errors differently.
        // For simplicity, we just accumulate errors and update data if valid.
        context.currentData = { ...context.currentData, ...result.data };
      } else {
        context.currentData = { ...context.currentData, ...result.data };
      }
    }

    return {
      isValid: true, // Simplified: assumes failure in a step doesn't invalidate the whole pipeline unless explicitly handled.
      errors: [], // Real implementation needs better error tracking per step.
      data: context.currentData,
    };
  }
}

export class PipelineBuilder {
  private steps: {
    condition: Condition;
    step: ValidationStep;
  }[] = [];

  private constructor() {}

  private static getInstance(): PipelineBuilder {
    if (!PipelineBuilder.instance) {
      PipelineBuilder.instance = new PipelineBuilder();
    }
    return PipelineBuilder.instance;
  }

  public static getInstance(): PipelineBuilder {
    return this.getInstance();
  }

  public addStep(step: ValidationStep): PipelineBuilder {
    this.steps.push({
      condition: () => true,
      step: step,
    });
    return this;
  }

  public addConditionalStep(condition: Condition, step: ValidationStep): PipelineBuilder {
    this.steps.push({
      condition: condition,
      step: step,
    });
    return this;
  }

  public build(): ValidationPipeline {
    return new ValidationPipeline(this.steps);
  }

  public reset(): PipelineBuilder {
    this.steps = [];
    return this;
  }

  private static instance: PipelineBuilder;
}