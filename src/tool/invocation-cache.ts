import { Message, ToolUseBlock } from "./types";

interface CacheStore {
  get: (key: string) => any | undefined;
  set: (key: string, value: any, ttl: number) => void;
  delete: (key: string) => void;
}

class InMemoryCacheStore implements CacheStore {
  private cache: Map<string, { value: any; expiry: number }>;

  constructor() {
    this.cache = new Map();
  }

  get(key: string): any | undefined {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }
    if (item.expiry < Date.now()) {
      this.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key: string, value: any, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export class ToolInvocationCache {
  private cacheStore: CacheStore;

  constructor(cacheStore: CacheStore = new InMemoryCacheStore()) {
    this.cacheStore = cacheStore;
  }

  private generateKey(toolName: string, input: Record<string, unknown>): string {
    const sortedKeys = Object.keys(input).sort();
    const sortedParams = sortedKeys.map(key =>
      `${key}:${JSON.stringify(input[key])}`
    ).join("|");

    return `${toolName}::${sortedParams}`;
  }

  public get(toolName: string, input: Record<string, unknown>): any | undefined {
    const key = this.generateKey(toolName, input);
    return this.cacheStore.get(key);
  }

  public set(toolName: string, input: Record<string, unknown>, result: any, ttl: number): void {
    const key = this.generateKey(toolName, input);
    this.cacheStore.set(key, result, ttl);
  }

  public clear(toolName: string): void {
    // In a real system, we might clear by tool name prefix,
    // but for simplicity, we'll just clear all related keys if needed,
    // or rely on TTL for cleanup.
  }
}