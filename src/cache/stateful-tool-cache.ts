import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

interface CacheStorage {
  get(key: string): unknown | undefined;
  set(key: string, value: unknown, ttlMs: number): void;
  delete(key: string): void;
}

export class StatefulToolCache {
  private storage: CacheStorage;
  private keyGenerator: (toolName: string, inputs: Record<string, unknown>, sessionId: string) => string;

  constructor(storage: CacheStorage, keyGenerator: (toolName: string, inputs: Record<string, unknown>, sessionId: string) => string) {
    this.storage = storage;
    this.keyGenerator = keyGenerator;
  }

  public get(toolName: string, inputs: Record<string, unknown>, sessionId: string): unknown | undefined {
    const key = this.keyGenerator(toolName, inputs, sessionId);
    return this.storage.get(key);
  }

  public set(toolName: string, inputs: Record<string, unknown>, value: unknown, ttlMs: number): void {
    const key = this.keyGenerator(toolName, inputs, sessionId);
    this.storage.set(key, value, ttlMs);
  }

  public clear(toolName: string, inputs: Record<string, unknown>, sessionId: string): void {
    const key = this.keyGenerator(toolName, inputs, sessionId);
    this.storage.delete(key);
  }
}

export class InMemoryCacheStorage implements CacheStorage {
  private cache: Map<string, { value: unknown; expiresAt: number }>;

  constructor() {
    this.cache = new Map();
  }

  public get(key: string): unknown | undefined {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }
    if (item.expiresAt < Date.now()) {
      this.delete(key);
      return undefined;
    }
    return item.value;
  }

  public set(key: string, value: unknown, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }
}