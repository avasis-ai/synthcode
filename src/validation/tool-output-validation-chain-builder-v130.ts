import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ValidationStep = (input: any) => Promise<any>;

interface ValidationChain {
  execute: (input: any) => Promise<any>;
}

abstract class BaseValidationBuilder {
  protected steps: ValidationStep[] = [];

  protected addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public abstract build(): ValidationChain;
}

export class ToolOutputValidationChainBuilderV130 extends BaseValidationBuilder {
  private conditionalSteps: {
    condition: (input: any) => boolean;
    steps: ValidationStep[];
  }[] = [];

  private parallelGroups: {
    steps: ValidationStep[];
  }[] = [];

  addSequentialStep(step: ValidationStep): this {
    return this.addStep(step);
  }

  addConditionalStep(condition: (input: any) => boolean, steps: ValidationStep[]): this {
    this.conditionalSteps.push({ condition, steps });
    return this;
  }

  addParallelGroup(steps: ValidationStep[]): this {
    this.parallelGroups.push({ steps });
    return this;
  }

  private buildSequentialExecutor(): ValidationStep {
    return async (input: any): Promise<any> => {
      let currentInput: any = input;
      for (const step of this.steps) {
        currentInput = await step(currentInput);
      }
      return currentInput;
    };
  }

  private buildConditionalExecutor(): ValidationStep {
    return async (input: any): Promise<any> => {
      let currentInput: any = input;
      for (const { condition, steps } of this.conditionalSteps) {
        if (condition(currentInput)) {
          let tempInput: any = currentInput;
          for (const step of steps) {
            tempInput = await step(tempInput);
          }
          currentInput = tempInput;
        }
      }
      return currentInput;
    };
  }

  private buildParallelExecutor(): ValidationStep {
    return async (input: any): Promise<any> => {
      let currentInput: any = input;
      let lastResult: any = currentInput;

      for (const { steps } of this.parallelGroups) {
        const promises: Promise<any>[] = steps.map(async (step) => {
          return step(currentInput);
        });
        const results = await Promise.all(promises);
        // For simplicity, we aggregate results into an array for the next stage
        lastResult = results;
      }
      return lastResult;
    };
  }

  public build(): ValidationChain {
    const sequentialExecutor = this.buildSequentialExecutor();
    const conditionalExecutor = this.buildConditionalExecutor();
    const parallelExecutor = this.buildParallelExecutor();

    return {
      execute: async (input: any): Promise<any> => {
        let result: any = input;

        // 1. Execute sequential steps first
        result = await sequentialExecutor(input);

        // 2. Execute conditional steps next
        result = await conditionalExecutor(result);

        // 3. Execute parallel groups last
        result = await parallelExecutor(result);

        return result;
      },
    };
  }
}