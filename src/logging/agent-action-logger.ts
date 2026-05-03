import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AgentActionPayload {
  actionType: "DECISION" | "TOOL_CALL" | "CONTEXT_UPDATE" | "INTERNAL_STEP";
  sourceComponent: string;
  actionDetails: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  confidenceScore?: number;
}

export class AgentActionLogger {
  private readonly logSink: (log: any) => void;

  constructor(logSink: (log: any) => void = console.log) {
    this.logSink = logSink;
  }

  logAction(payload: AgentActionPayload): void {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      action: payload,
    };
    this.logSink(structuredLog);
  }

  logDecision(
    sourceComponent: string,
    actionDetails: Record<string, unknown>,
    metadata?: Record<string, unknown>,
    confidenceScore?: number
  ): void {
    const payload: AgentActionPayload = {
      actionType: "DECISION",
      sourceComponent,
      actionDetails,
      metadata,
      confidenceScore,
    };
    this.logAction(payload);
  }

  logToolCall(
    sourceComponent: string,
    toolUseId: string,
    toolName: string,
    input: Record<string, unknown>,
    metadata?: Record<string, unknown>,
    confidenceScore?: number
  ): void {
    const payload: AgentActionPayload = {
      actionType: "TOOL_CALL",
      sourceComponent,
      actionDetails: {
        toolUseId,
        toolName,
        input,
      },
      metadata,
      confidenceScore,
    };
    this.logAction(payload);
  }

  logContextUpdate(
    sourceComponent: string,
    updateKey: string,
    newValue: unknown,
    metadata?: Record<string, unknown>
  ): void {
    const payload: AgentActionPayload = {
      actionType: "CONTEXT_UPDATE",
      sourceComponent,
      actionDetails: {
        key: updateKey,
        value: newValue,
      },
      metadata,
    };
    this.logAction(payload);
  }

  logInternalStep(
    sourceComponent: string,
    stepDescription: string,
    metadata?: Record<string, unknown>
  ): void {
    const payload: AgentActionPayload = {
      actionType: "INTERNAL_STEP",
      sourceComponent,
      actionDetails: {
        description: stepDescription,
      },
      metadata,
    };
    this.logAction(payload);
  }
}