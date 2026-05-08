import { EventEmitter } from "node:events";

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
  | { type: "tool_result"; result: ToolResultMessage };

interface StateData<T> {
  data: T;
  version: number;
}

export class OptimisticConcurrencyManager {
  private store: Map<string, StateData<any>>;

  constructor() {
    this.store = new Map();
  }

  /**
   * Reads the current state and its version from the store.
   * @param key The unique identifier for the state.
   * @returns The state data, or null if the key does not exist.
   */
  public readState<T>(key: string): { data: T; version: number } | null {
    const state = this.store.get(key);
    if (!state) {
      return null;
    }
    return { data: state.data as T, version: state.version };
  }

  /**
   * Attempts to write a new state only if the expected version matches the current stored version.
   * @param key The unique identifier for the state.
   * @param expectedVersion The version the caller expects the state to be at.
   * @param newState The new data to write.
   * @returns True if the update succeeded, false if a conflict occurred (version mismatch).
   */
  public writeState<T>(key: string, expectedVersion: number, newState: T): boolean {
    const currentState = this.store.get(key);

    if (!currentState) {
      // If the state doesn't exist, we can only write if we expect version 0 (initial write).
      if (expectedVersion !== 0) {
        return false;
      }
      // Initialize the state
      this.store.set(key, { data: newState, version: 1 });
      return true;
    }

    if (currentState.version !== expectedVersion) {
      // Conflict detected: The state was modified by another process.
      return false;
    }

    // Success: Update the state and increment the version.
    const newVersion = currentState.version + 1;
    this.store.set(key, { data: newState, version: newVersion });
    return true;
  }
}

export { OptimisticConcurrencyManager };