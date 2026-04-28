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

export interface ValidationContext {
  initialInput: Record<string, unknown>;
  currentContext: Record<string, unknown>;
  previousStepOutput: unknown;
}

export interface ValidationStep<TInput, TOutput> {
  name: string;
  execute: (context: ValidationContext) => Promise<{ output: TOutput; context: ValidationContext }>;
}

export class CascadingValidator<TInitialInput, TFinalOutput> {
  private steps: ValidationStep<any, any>[];

  constructor(initialInput: TInitialInput) {
    this.steps = [];
  }

  addStep(step: ValidationStep<any, any>): CascadingValidator<TInitialInput, TFinalOutput> {
    this.steps.push(step);
    return this;
  }

  async validate(initialContext: ValidationContext): Promise<TFinalOutput> {
    let context: ValidationContext = {
      initialInput: initialContext.initialInput,
      currentContext: initialContext.initialInput,
      previousStepOutput: undefined,
    };

    for (const step of this.steps) {
      const result = await step.execute(context);
      context.previousStepOutput = result.output;
      context.currentContext = result.context;
    }

    // Type assertion for the final output
    return context.previousStepOutput as TFinalOutput;
  }
}

export class PipelineBuilder {
  public static create<TInitialInput, TFinalOutput>(initialInput: TInitialInput): CascadingValidator<TInitialInput, TFinalOutput> {
    return new CascadingValidator<TInitialInput, TFinalOutput>(initialInput);
  }
}