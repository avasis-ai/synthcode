import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationStep {
  validate(input: any): Promise<{ isValid: boolean; result: any; error?: string }>;
}

export class RequestResponsePipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public async run(data: any): Promise<any> {
    let currentResult: any = data;

    for (const step of this.steps) {
      const validationResult = await step.validate(currentResult);

      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          data: currentResult,
        };
      }

      currentResult = validationResult.result;
    }

    return {
      success: true,
      result: currentResult,
    };
  }
}