import { Message, ToolResultMessage } from "./types";

export interface ValidationStep<TInput, TOutput> {
  execute: (input: TInput) => Promise<TOutput>;
}

export class ToolOutputValidationChain<TInitialInput, TFinalOutput> {
  private steps: { input: any; step: ValidationStep<any, any> }[];
  private initialInput: TInitialInput;

  constructor(steps: { input: any; step: ValidationStep<any, any> }[], initialInput: TInitialInput) {
    this.steps = steps;
    this.initialInput = initialInput;
  }

  public async execute(): Promise<TFinalOutput> {
    let currentOutput: any = this.initialInput;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      try {
        currentOutput = await step.step.execute(currentOutput);
      } catch (error) {
        throw new Error(`Validation chain failed at step ${i}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return currentOutput as TFinalOutput;
  }
}