import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextualMetadata {
  timestamp: number;
  source: string;
  context_window_ms: number;
}

export interface ContextualState {
  messages: Message[];
  metadata: ContextualMetadata;
}

export interface ContextualStateDiffPayload {
  diff: {
    messages: {
      added: Message[];
      removed: Message[];
      updated: {
        old: Message;
        new: Message;
        reason: string;
      }[];
    };
    metadata: {
      changed: boolean;
      details: string;
    };
  };
  context: {
    is_significant: boolean;
    reason: string;
  };
}

export class ContextualStateDiffingV10Service {
  private readonly metadataDiffThresholdMs: number;

  constructor(metadataDiffThresholdMs: number = 5000) {
    this.metadataDiffThresholdMs = metadataDiffThresholdMs;
  }

  private calculateMessageDiff(oldMessages: Message[], newMessages: Message[]): {
    added: Message[];
    removed: Message[];
    updated: {
      old: Message;
      new: Message;
      reason: string;
    }[];
  } {
    const added: Message[] = [];
    const removed: Message[] = [];
    const updated: {
      old: Message;
      new: Message;
      reason: string;
    }[] = [];

    const oldMap = new Map<string, Message>();
    oldMessages.forEach((msg, index) => oldMap.set(`${msg.role}-${index}`, msg));

    const newMap = new Map<string, Message>();
    newMessages.forEach((msg, index) => newMap.set(`${msg.role}-${index}`, msg));

    // Simple comparison: assume index stability for simplicity in this context
    const minLength = Math.min(oldMessages.length, newMessages.length);

    for (let i = 0; i < minLength; i++) {
      const oldMsg = oldMessages[i];
      const newMsg = newMessages[i];

      if (JSON.stringify(oldMsg) !== JSON.stringify(newMsg)) {
        const reason = `Content change detected at index ${i}.`;
        updated.push({ old: oldMsg, new: newMsg, reason });
      }
    }

    // Check for additions/removals based on length difference
    if (newMessages.length > oldMessages.length) {
      for (let i = oldMessages.length; i < newMessages.length; i++) {
        added.push(newMessages[i]);
      }
    } else if (oldMessages.length > newMessages.length) {
      for (let i = newMessages.length; i < oldMessages.length; i++) {
        removed.push(oldMessages[i]);
      }
    }

    return { added, removed, updated };
  }

  public diff(oldState: ContextualState, newState: ContextualState): ContextualStateDiffPayload {
    const messageDiff = this.calculateMessageDiff(oldState.messages, newState.messages);

    const metadataChanged = Math.abs(oldState.metadata.timestamp - newState.metadata.timestamp) > this.metadataDiffThresholdMs;
    const metadataDetails = metadataChanged
      ? `Timestamp changed significantly (${oldState.metadata.timestamp} -> ${newState.metadata.timestamp}).`
      : `Metadata stable within threshold.`;

    const isSignificant = messageDiff.added.length > 0 ||
      messageDiff.updated.length > 0 ||
      metadataChanged;

    const context: { is_significant: boolean; reason: string } = {
      is_significant: isSignificant,
      reason: isSignificant ? "Significant state change detected based on content or temporal metadata." : "State change is minor or within acceptable thresholds.",
    };

    const payload: ContextualStateDiffPayload = {
      diff: {
        messages: {
          added: messageDiff.added,
          removed: messageDiff.removed,
          updated: messageDiff.updated,
        },
        metadata: {
          changed: metadataChanged,
          details: metadataDetails,
        },
      },
      context: context,
    };

    return payload;
  }
}

export { ContextualStateDiffingV10Service };