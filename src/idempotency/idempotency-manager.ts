import { TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Message = { role: "user" } | { role: "assistant" } | { role: "tool" };

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: TextBlock[] | ToolUseBlock[] | ThinkingBlock[];
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

export interface IdempotencyKey {
  key: string;
}

export type TransactionContext<T> = {
  key: IdempotencyKey;
  result: T;
};

export class IdempotencyManager {
  private store: Map<string, Promise<any>>;

  constructor() {
    this.store = new Map();
  }

  private async getCachedResult<T>(key: string): Promise<T> {
    const cachedPromise = this.store.get(key);
    if (cachedPromise) {
      return cachedPromise as Promise<T>;
    }
    throw new Error(`No cached result found for key: ${key}`);
  }

  public async execute<T>(
    key: IdempotencyKey,
    action: () => Promise<T>
  ): Promise<T> {
    const keyString = key.key;

    if (this.store.has(keyString)) {
      return this.getCachedResult<T>(keyString);
    }

    const executionPromise = (async () => {
      try {
        const result = await action();
        
        // Store the result promise to ensure subsequent calls wait for the same execution
        this.store.set(keyString, Promise.resolve(result));
        return result;
      } catch (error) {
        // Do not store errors, allow them to propagate
        throw error;
      }
    })();

    this.store.set(keyString, executionPromise);
    return executionPromise;
  }

  public async clearKey(key: IdempotencyKey): Promise<void> {
    this.store.delete(key.key);
  }
}

export { IdempotencyManager };