import { EventEmitter } from "events";

export type ToolLimitConfig = {
  maxCalls: number;
  windowMs: number;
};

export interface ToolInvocationLimiter {
  isAllowed(toolId: string, context: { sessionId: string }): Promise<boolean>;
}

export class StatefulToolInvocationLimiter implements ToolInvocationLimiter {
  private readonly toolLimits: Map<string, ToolLimitConfig>;
  private readonly invocationStore: Map<string, { count: number; lastResetTime: number; lastInvocationTime: number }>;

  constructor(toolLimits: Map<string, ToolLimitConfig>) {
    this.toolLimits = toolLimits;
    this.invocationStore = new Map();
  }

  private getStoreKey(toolId: string): string {
    return `${toolId}:${this.getGlobalSessionId()}`;
  }

  private getGlobalSessionId(): string {
    // In a real application, this would derive the session ID from the context passed to isAllowed.
    // For this isolated class structure, we assume context provides it or we use a placeholder.
    return "default_session";
  }

  private getStore(toolId: string, sessionId: string): {
    count: number;
    lastResetTime: number;
    lastInvocationTime: number;
  } {
    const key = `${toolId}:${sessionId}`;
    if (!this.invocationStore.has(key)) {
      this.invocationStore.set(key, {
        count: 0,
        lastResetTime: Date.now(),
        lastInvocationTime: 0,
      });
    }
    return this.invocationStore.get(key)!;
  }

  private checkAndReset(toolId: string, sessionId: string, config: ToolLimitConfig): {
    count: number;
    lastResetTime: number;
  } {
    const key = `${toolId}:${sessionId}`;
    const store = this.getStore(toolId, sessionId);
    const now = Date.now();

    if (now > store.lastResetTime + config.windowMs) {
      // Window expired, reset count and time
      return { count: 1, lastResetTime: now };
    } else {
      // Window active, check count
      if (store.count >= config.maxCalls) {
        return { count: store.count, lastResetTime: store.lastResetTime };
      } else {
        // Increment count
        return { count: store.count + 1, lastResetTime: store.lastResetTime };
      }
    }
  }

  public async isAllowed(toolId: string, context: { sessionId: string }): Promise<boolean> {
    const config = this.toolLimits.get(toolId);
    if (!config) {
      return true; // No limit configured, always allowed
    }

    const now = Date.now();
    const key = `${toolId}:${context.sessionId}`;
    let store = this.getStore(toolId, context.sessionId);

    // 1. Check for window reset
    if (now > store.lastResetTime + config.windowMs) {
      store.count = 1;
      store.lastResetTime = now;
      store.lastInvocationTime = now;
      this.invocationStore.set(key, store);
      return true;
    }

    // 2. Check for rate limit breach
    if (store.count >= config.maxCalls) {
      return false;
    }

    // 3. Allowed: Increment count and update timestamp
    store.count += 1;
    store.lastInvocationTime = now;
    this.invocationStore.set(key, store);
    return true;
  }
}