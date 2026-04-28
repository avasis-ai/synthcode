import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationStep {
  validate(data: any, context: any): { isValid: boolean; error?: string; data?: any };
}

export class StructuredOutputValidationChain {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(data: any, context: any): { isValid: boolean; error?: string; data?: any } {
    let currentData: any = data;

    for (const step of this.steps) {
      const result = step.validate(currentData, context);

      if (!result.isValid) {
        return {
          isValid: false,
          error: result.error,
          data: undefined,
        };
      }

      currentData = result.data !== undefined ? result.data : currentData;
    }

    return {
      isValid: true,
      error: undefined,
      data: currentData,
    };
  }
}