import { ToolCall, PreconditionChecker, Message } from "./types";

export class ToolCallPreconditionChainValidator {
  private readonly preconditionChain: { toolCall: ToolCall; precondition: PreconditionChecker }[];

  constructor(preconditionChain: { toolCall: ToolCall; precondition: PreconditionChecker }[]) {
    this.preconditionChain = preconditionChain;
  }

  public validateChain(
    previousToolResult: Message | undefined,
  ): { isValid: boolean; context: Record<string, unknown> } {
    let currentContext: Record<string, unknown> = {};

    if (previousToolResult) {
      if (previousToolResult.role === "tool") {
        const result = previousToolResult as ToolResultMessage;
        currentContext = {
          tool_result: result.content,
          tool_use_id: result.tool_use_id,
        };
      }
    }

    for (let i = 0; i < this.preconditionChain.length; i++) {
      const { toolCall, precondition } = this.preconditionChain[i];

      const validationResult = precondition(currentContext, toolCall);

      if (!validationResult.isValid) {
        return {
          isValid: false,
          context: {
            error: validationResult.error,
          },
        };
      }

      currentContext = {
        ...currentContext,
        ...validationResult.newContext,
      };
    }

    return { isValid: true, context: currentContext };
  }
}