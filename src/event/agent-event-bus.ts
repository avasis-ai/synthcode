import { EventEmitter } from 'node:events';

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

export class AgentEventBus {
  private listeners: Map<string, Set<(payload: any) => void>>;

  constructor() {
    this.listeners = new Map<string, Set<(payload: any) => void>>();
  }

  subscribe<T>(eventType: string, listener: (payload: T) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const eventListeners = this.listeners.get(eventType)!;
    eventListeners.add(listener);

    return () => this.unsubscribe(eventType, listener);
  }

  unsubscribe<T>(eventType: string, listener: (payload: T) => void): boolean {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventType);
      }
      return true;
    }
    return false;
  }

  publish<T>(eventType: string, payload: T): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error executing listener for event ${eventType}:`, error);
        }
      });
    }
  }
}

export { AgentEventBus };