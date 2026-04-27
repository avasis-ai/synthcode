import {
  ToolUseBlock,
  TextBlock,
  ThinkingBlock,
  ContentBlock,
} from "./types";

export interface ToolCallRecord {
  toolName: string;
  inputs: Record<string, unknown>;
  result: {
    success: boolean;
    output: any;
    error?: string;
  };
}

export interface ToolExecutionContext {
  history: ToolCallRecord[];
  finalState: Record<string, any>;
}

export class ToolExecutionContextManager {
  private history: ToolCallRecord[] = [];
  private state: Record<string, any> = {};

  addToolCall(toolName: string, inputs: Record<string, unknown>): void {
    this.history.push({
      toolName,
      inputs,
      result: {
        success: false,
        output: undefined,
      },
    });
  }

  recordResult(toolName: string, success: boolean, output: any, error?: string): void {
    const record = this.history.find((record) => record.toolName === toolName);
    if (record) {
      record.result = {
        success,
        output,
        error,
      };
    } else {
      console.warn(
        `Attempted to record result for unknown tool: ${toolName}`
      );
    }
  }

  updateState(key: string, value: any): void {
    this.state[key] = value;
  }

  finalizeContext(): ToolExecutionContext {
    return {
      history: [...this.history],
      finalState: { ...this.state },
    };
  }
}