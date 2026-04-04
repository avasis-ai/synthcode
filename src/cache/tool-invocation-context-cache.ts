import { Message } from "./types";

export interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class ToolInvocationContextCache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map<string, CacheEntry<any>>();
  }

  private generateKey(toolName: string, args: Record<string, unknown>): string {
    const serializedArgs = JSON.stringify(args);
    return `${toolName}::${serializedArgs}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiry;
  }

  public tryGet<T>(toolName: string, args: Record<string, unknown>): T | null {
    const key = this.generateKey(toolName, args);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    return entry.value as T;
  }

  public trySet<T>(toolName: string, args: Record<string, unknown>, value: T, ttlMs: number): void {
    const key = this.generateKey(toolName, args);
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  public clear(): void {
    this.cache.clear();
  }
}