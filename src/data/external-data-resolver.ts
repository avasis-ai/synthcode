import { EventEmitter } from "node:events";

export type Message = { role: "user" | "assistant" | "tool"; content: any };

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

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

export type DataSource = {
  id: string;
  fetcher: (params: Record<string, unknown>) => Promise<any>;
  cacheKey: (params: Record<string, unknown>) => string;
  ttlSeconds: number;
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ExternalDataResolver extends EventEmitter {
  private cache = new Map<string, <any, CacheEntry<any>>>();
  private sources: Map<string, DataSource> = new Map();

  constructor() {
    super();
  }

  registerSource(source: DataSource): void {
    if (this.sources.has(source.id)) {
      throw new Error(`Source ID ${source.id} already registered.`);
    }
    this.sources.set(source.id, source);
  }

  private getCacheKey(sourceId: string, params: Record<string, unknown>): string {
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found.`);
    }
    return source.cacheKey(params);
  }

  private getCache(sourceId: string, params: Record<string, unknown>): CacheEntry<any> | undefined {
    const key = this.getCacheKey(sourceId, params);
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    const source = this.sources.get(sourceId)!;
    const expirationTime = entry.timestamp + source.ttlSeconds * 1000;
    if (Date.now() > expirationTime) {
      this.cache.delete(key);
      return undefined;
    }
    return entry;
  }

  private setCache(sourceId: string, params: Record<string, unknown>, data: any, ttlSeconds: number): void {
    const key = this.getCacheKey(sourceId, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async resolveData(sourceId: string, params: Record<string, unknown>): Promise<any> {
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new Error(`External data source ${sourceId} is not registered.`);
    }

    const cachedData = this.getCache(sourceId, params);
    if (cachedData) {
      return cachedData.data;
    }

    try {
      const data = await source.fetcher(params);
      this.setCache(sourceId, params, data, source.ttlSeconds);
      return data;
    } catch (error) {
      this.emit("data_fetch_failed", { sourceId, params, error });
      throw new Error(`Failed to resolve data from ${sourceId}: ${(error as Error).message}`);
    }
  }
}