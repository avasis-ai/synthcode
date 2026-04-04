import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface PipelineStep<TInput, TOutput> {
  execute: (inputContext: TInput) => Promise<TOutput>;
}

export class ToolPipeline<TInput, TOutput> {
  private steps: { step: PipelineStep<any, any>; name: string }[];

  constructor(steps: { step: PipelineStep<any, any>; name: string }[]) {
    this.steps = steps;
  }

  public async execute(initialContext: TInput): Promise<TOutput> {
    let currentContext: any = initialContext;

    for (const { step, name } of this.steps) {
      try {
        const result = await step.execute(currentContext);
        currentContext = result;
      } catch (error) {
        console.error(`Pipeline step "${name}" failed:`, error);
        throw new Error(`Pipeline execution failed at step "${name}": ${(error as Error).message}`);
      }
    }

    return currentContext as TOutput;
  }
}