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

type ToolExecutionState = "PENDING" | "SUCCESS" | "FAILURE" | "SKIPPED";

interface ToolExecutionRecord {
  tool_use_id: string;
  state: ToolExecutionState;
  last_result: string | null;
  attempt_count: number;
}

export class StatefulToolExecutionGuardrail {
  private toolStates: Map<string, ToolExecutionRecord>;

  constructor() {
    this.toolStates = new Map<string, ToolExecutionRecord>();
  }

  private getToolState(toolUseId: string): ToolExecutionRecord | undefined {
    return this.toolStates.get(toolUseId);
  }

  private setToolState(toolUseId: string, state: ToolExecutionState, result: string | null, attempt: number): void {
    this.toolStates.set(toolUseId, {
      tool_use_id: toolUseId,
      state: state,
      last_result: result,
      attempt_count: attempt,
    });
  }

  public initializeToolCall(toolUseId: string): void {
    if (!this.getToolState(toolUseId)) {
      this.setToolState(toolUseId, "PENDING", null, 0);
    }
  }

  public canExecuteTool(toolUseId: string): boolean {
    const state = this.getToolState(toolUseId);
    if (!state) {
      return true; // No record, assume it can run
    }

    if (state.state === "SUCCESS") {
      return false; // Already succeeded, prevent redundant calls
    }

    if (state.state === "FAILURE") {
      // Implement retry logic here if needed, for now, prevent execution
      return false;
    }

    if (state.state === "PENDING") {
      // Allow execution if pending, but maybe warn about potential race conditions
      return true;
    }

    return true;
  }

  public updateToolState(toolUseId: string, resultContent: string, isError: boolean): void {
    const currentState = this.getToolState(toolUseId);
    if (!currentState) {
      console.warn(`Attempted to update state for unknown tool ID: ${toolUseId}`);
      return;
    }

    let newState: ToolExecutionState;
    let finalResult: string | null;

    if (isError) {
      newState = "FAILURE";
      finalResult = `Error occurred: ${resultContent}`;
    } else {
      newState = "SUCCESS";
      finalResult = resultContent;
    }

    this.setToolState(toolUseId, newState, finalResult, currentState.attempt_count + 1);
  }

  public getToolStateSummary(): Map<string, ToolExecutionRecord> {
    return new Map(this.toolStates);
  }
}