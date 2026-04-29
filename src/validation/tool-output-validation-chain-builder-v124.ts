import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationResult<T> {
  isValid: boolean;
  output: T;
  errors: string[];
}

export type ValidationStep<T> = (input: T) => ValidationResult<T>;

export interface ValidationSummary {
  isValid: boolean;
  errors: string[];
  finalOutput: any;
}

export class ToolOutputValidationChainBuilder {
  private steps: ValidationStep<any>[] = [];

  addStep(step: ValidationStep<any>): this {
    this.steps.push(step);
    return this;
  }

  build(): (input: any) => ValidationSummary {
    return (input: any): ValidationSummary => {
      let currentOutput: any = input;
      const errors: string[] = [];

      for (const step of this.steps) {
        const result = step(currentOutput);

        if (!result.isValid) {
          errors.push(...result.errors);
          break;
        }

        currentOutput = result.output;
      }

      const summary: ValidationSummary = {
        isValid: errors.length === 0,
        errors: errors,
        finalOutput: currentOutput,
      };

      return summary;
    };
  }
}