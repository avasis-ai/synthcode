export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export type ConfidenceScore = number;

export interface AuditEntry {
  timestamp: Date;
  action: string;
  sourceComponent: string;
  justification: string;
  confidence: ConfidenceScore;
  context: Record<string, unknown>;
  relatedMessage?: Message;
}

export class AuditTrailManager {
  private history: AuditEntry[] = [];

  recordEntry(
    action: string,
    sourceComponent: string,
    justification: string,
    confidence: ConfidenceScore,
    context: Record<string, unknown>,
    relatedMessage?: Message
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date(),
      action,
      sourceComponent,
      justification,
      confidence,
      context,
      relatedMessage: relatedMessage ?? undefined,
    };
    this.history.push(entry);
  }

  queryHistory(
    filter: {
      action?: string;
      sourceComponent?: string;
      minConfidence?: ConfidenceScore;
    }
  ): AuditEntry[] {
    return this.history.filter((entry) => {
      if (filter.action && entry.action !== filter.action) {
        return false;
      }
      if (filter.sourceComponent && entry.sourceComponent !== filter.sourceComponent) {
        return false;
      }
      if (filter.minConfidence !== undefined && entry.confidence < filter.minConfidence) {
        return false;
      }
      return true;
    });
  }

  getHistoryCount(): number {
    return this.history.length;
  }
}

export { AuditTrailManager };