import { ToolCall, ToolInvocationContext } from "./tool-call-precondition-chain.types";

export interface PreconditionChecker {
  check(toolCall: ToolCall, context: ToolInvocationContext): { success: boolean; message: string };
}

export class ToolCallPreconditionChain {
  private checkers: PreconditionChecker[];

  constructor(checkers: PreconditionChecker[] = []) {
    this.checkers = checkers;
  }

  static create(checkers: PreconditionChecker[]): ToolCallPreconditionChain {
    return new ToolCallPreconditionChain(checkers);
  }

  public check(toolCall: ToolCall, context: ToolInvocationContext): { success: boolean; message: string } {
    for (const checker of this.checkers) {
      const result = checker.check(toolCall, context);
      if (!result.success) {
        return { success: false, message: result.message };
      }
    }
    return { success: true, message: "All preconditions passed." };
  }
}

export { ToolCallPreconditionChain }