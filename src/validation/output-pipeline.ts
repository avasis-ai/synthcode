import { Message, ToolResultMessage } from "./types";

export interface PipelineStep {
  execute: (input: any) => any;
  onError?: (error: unknown, input: any) => any;
}

export class OutputPipeline {
  private steps: PipelineStep[];

  constructor(steps: PipelineStep[]) {
    this.steps = steps;
  }

  public process(input: any): any {
    let currentOutput: any = input;

    for (const step of this.steps) {
      try {
        currentOutput = step.execute(currentOutput);
      } catch (error) {
        if (step.onError) {
          try {
            return step.onError(error, currentOutput);
          } catch (handlerError) {
            console.error("Error in pipeline step error handler:", handlerError);
            throw new Error(`Pipeline failed at step due to error: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          throw new Error(`Pipeline failed at step: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return currentOutput;
  }
}