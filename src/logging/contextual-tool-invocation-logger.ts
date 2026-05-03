import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ToolInvocationContext {
  toolName: string;
  toolInput: Record<string, unknown>;
  currentStateSnapshot: Record<string, any>;
  activeConstraints: string[];
  history: Message[];
  toolDefinition: Record<string, any>;
}

export interface ToolInvocationLogRecord {
  timestamp: number;
  toolName: string;
  toolInput: Record<string, unknown>;
  context: {
    currentStateSnapshot: Record<string, any>;
    activeConstraints: string[];
    history: Message[];
    toolDefinition: Record<string, any>;
  };
  invocationContext: ToolInvocationContext;
  status: "before" | "after";
  details: {
    success: boolean;
    output?: string;
    error?: string;
  };
}

export class ContextualToolInvocationLogger {
  private logRecords: ToolInvocationLogRecord[] = [];

  private createBaseRecord(
    toolName: string,
    toolInput: Record<string, unknown>,
    context: ToolInvocationContext,
    status: "before" | "after"
  ): ToolInvocationLogRecord {
    return {
      timestamp: Date.now(),
      toolName: toolName,
      toolInput: toolInput,
      context: {
        currentStateSnapshot: context.currentStateSnapshot,
        activeConstraints: context.activeConstraints,
        history: context.history,
        toolDefinition: context.toolDefinition,
      },
      invocationContext: context,
      status: status,
      details: {
        success: status === "before",
      },
    };
  }

  public logBeforeInvocation(
    toolName: string,
    toolInput: Record<string, unknown>,
    context: ToolInvocationContext
  ): ToolInvocationLogRecord {
    const record = this.createBaseRecord(toolName, toolInput, context, "before");
    this.logRecords.push(record);
    return record;
  }

  public logAfterInvocation(
    toolName: string,
    toolInput: Record<string, unknown>,
    context: ToolInvocationContext,
    success: boolean,
    output?: string,
    error?: string
  ): ToolInvocationLogRecord {
    const record = this.createBaseRecord(toolName, toolInput, context, "after");
    record.details = {
      success: success,
      output: output,
      error: error,
    };
    this.logRecords.push(record);
    return record;
  }

  public getLogs(): ToolInvocationLogRecord[] {
    return [...this.logRecords];
  }

  public clearLogs(): void {
    this.logRecords = [];
  }
}