import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class ToolExecutionContext {
  private readonly contextId: string;
  private contextStore: Map<string, unknown>;

  constructor(contextId: string) {
    this.contextId = contextId;
    this.contextStore = new Map<string, unknown>();
  }

  get contextId(): string {
    return this.contextId;
  }

  setContext(key: string, value: unknown): void {
    if (!key || typeof key !== "string") {
      throw new Error("Context key must be a non-empty string.");
    }
    this.contextStore.set(key, value);
  }

  getContext<T>(key: string): T | undefined {
    if (!key || typeof key !== "string") {
      return undefined;
    }
    const value = this.contextStore.get(key);
    return (value as T) as T;
  }

  hasContext(key: string): boolean {
    return this.contextStore.has(key);
  }

  clearContext(key: string): boolean {
    return this.contextStore.delete(key);
  }

  getAllContextKeys(): Set<string> {
    return new Set(this.contextStore.keys());
  }

  getSnapshot(): Map<string, unknown> {
    return new Map(this.contextStore);
  }
}