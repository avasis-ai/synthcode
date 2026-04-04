import { Message, ToolUseBlock } from "./types";

export interface ToolInvocationRecord {
  toolName: string;
  toolArguments: Record<string, unknown>;
  timestamp: number;
  status: "SUCCESS" | "FAILURE" | "PENDING";
  output: string | null;
  invocationId: string;
}

export class ToolInvocationHistoryManager {
  private records: ToolInvocationRecord[] = [];

  public appendRecord(
    toolName: string,
    toolArguments: Record<string, unknown>,
    invocationId: string,
    status: "SUCCESS" | "FAILURE" | "PENDING",
    output: string | null = null
  ): void {
    const record: ToolInvocationRecord = {
      toolName,
      toolArguments,
      timestamp: Date.now(),
      status,
      output,
      invocationId,
    };
    this.records.push(record);
  }

  public getHistory(): ToolInvocationRecord[] {
    return [...this.records];
  }

  public getRecordsForTool(toolName: string): ToolInvocationRecord[] {
    return this.records.filter(record => record.toolName === toolName);
  }

  public getSummary(): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
  } {
    const totalCalls = this.records.length;
    const successfulCalls = this.records.filter(r => r.status === "SUCCESS").length;
    const failedCalls = this.records.filter(r => r.status === "FAILURE").length;
    return {
      totalCalls,
      successfulCalls,
      failedCalls,
    };
  }

  public clearHistory(): void {
    this.records = [];
  }
}

export const createToolInvocationHistoryManager = (): ToolInvocationHistoryManager => {
  return new ToolInvocationHistoryManager();
};