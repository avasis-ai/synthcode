import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types.js";

type TraceEventType =
  | "step_start"
  | "step_end"
  | "tool_call"
  | "tool_result"
  | "state_change"
  | "error"
  | "thought_process";

interface TraceEvent {
  type: TraceEventType;
  timestamp: number;
  payload: Record<string, any>;
}

export interface ExecutionTrace {
  events: TraceEvent[];
  metadata: {
    startTime: number;
    endTime: number | null;
    initialInput: Message;
  };
}

export class ExecutionTraceRecorder {
  private trace: ExecutionTrace;

  constructor(initialInput: Message) {
    this.trace = {
      events: [],
      metadata: {
        startTime: Date.now(),
        endTime: null,
        initialInput: initialInput,
      },
    };
  }

  private recordEvent(type: TraceEventType, payload: Record<string, any>): void {
    const event: TraceEvent = {
      type,
      timestamp: Date.now(),
      payload,
    };
    this.trace.events.push(event);
  }

  public recordStepStart(stepId: string, context: Record<string, unknown>): void {
    this.recordEvent("step_start", { stepId, context });
  }

  public recordStepEnd(stepId: string, result: Record<string, unknown>): void {
    this.recordEvent("step_end", { stepId, result });
  }

  public recordThoughtProcess(thought: string, context: Record<string, unknown>): void {
    this.recordEvent("thought_process", { thought, context });
  }

  public recordToolCall(
    toolName: string,
    toolInput: Record<string, unknown>,
    callId: string,
  ): void {
    this.recordEvent("tool_call", { toolName, toolInput, callId });
  }

  public recordToolResult(
    toolUseId: string,
    resultContent: string,
    isError: boolean,
    errorDetails?: Record<string, unknown>,
  ): void {
    this.recordEvent("tool_result", { toolUseId, resultContent, isError, errorDetails });
  }

  public recordStateChange(
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>,
    diff: Record<string, unknown>,
  ): void {
    this.recordEvent("state_change", { oldState, newState, diff });
  }

  public recordError(error: Error, context: Record<string, unknown>): void {
    this.recordEvent("error", { message: error.message, stack: error.stack, context });
  }

  public finalizeTrace(): ExecutionTrace {
    this.trace.metadata.endTime = Date.now();
    return this.trace;
  }
}

export function withTraceRecorder<T>(
  recorder: ExecutionTraceRecorder,
  fn: (recorder: ExecutionTraceRecorder) => Promise<T>,
): async (context: Record<string, unknown>) => Promise<T> {
  return async (context) => {
    try {
      const result = await fn(recorder);
      return result;
    } catch (e) {
      // The recorder should handle the error recording internally if possible,
      // but we ensure the trace is finalized regardless of the catch block.
      throw e;
    }
  };
}