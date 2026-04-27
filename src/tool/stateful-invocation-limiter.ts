import { EventEmitter } from "events";

type LimitConfig = {
  globalMaxCalls: number;
  globalWindowMs: number;
  toolSpecificLimits: Record<string, { maxCalls: number; windowMs: number }>;
  defaultCooldownMs?: number;
};

interface InvocationRecord {
  timestamp: number;
  toolName: string;
  contextHash: string;
}

export class ToolInvocationLimiter extends EventEmitter {
  private history: InvocationRecord[] = [];
  private config: LimitConfig;

  constructor(config: LimitConfig) {
    super();
    this.config = config;
  }

  private getContextHash(context: any): string {
    const jsonString = JSON.stringify(context);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  private getToolLimit(toolName: string): { maxCalls: number; windowMs: number } | undefined {
    return this.config.toolSpecificLimits[toolName];
  }

  private isWithinLimit(
    toolName: string,
    contextHash: string,
    currentTime: number
  ): { canInvoke: boolean; reason: string } {
    const toolLimit = this.getToolLimit(toolName);
    const globalLimit = { maxCalls: this.config.globalMaxCalls, windowMs: this.config.globalWindowMs };

    const checkLimit = (
      limit: { maxCalls: number; windowMs: number },
      history: InvocationRecord[]
    ): { canInvoke: boolean; reason: string } => {
      const windowStart = currentTime - limit.windowMs;
      const recentCalls = history.filter(
        (record) => record.toolName === toolName && record.contextHash === contextHash && record.timestamp >= windowStart
      );

      if (recentCalls.length >= limit.maxCalls) {
        const oldestCallTime = recentCalls[0].timestamp;
        const timeRemaining = Math.ceil((limit.windowMs - (currentTime - oldestCallTime)) / 1000);
        return {
          canInvoke: false,
          reason: `Rate limit exceeded for ${toolName}. Try again in ${Math.max(1, timeRemaining)} seconds.`,
        };
      }
      return { canInvoke: true, reason: "Within limit." };
    };

    // 1. Check Tool Specific Limit
    if (toolLimit) {
      const toolCheck = checkLimit(toolLimit, this.history);
      if (!toolCheck.canInvoke) {
        return { canInvoke: false, reason: toolCheck.reason };
      }
    }

    // 2. Check Global Limit (Simplified: checking all calls for simplicity, though context-aware global might be better)
    const globalCheck = checkLimit(globalLimit, this.history);
    if (!globalCheck.canInvoke) {
      return { canInvoke: false, reason: globalCheck.reason };
    }

    return { canInvoke: true, reason: "All limits respected." };
  }

  public async canInvoke(toolName: string, context: any): Promise<boolean> {
    const currentTime = Date.now();
    const contextHash = this.getContextHash(context);

    const check = this.isWithinLimit(toolName, contextHash, currentTime);

    if (!check.canInvoke) {
      this.emit("invocation_blocked", { toolName, reason: check.reason });
      return false;
    }

    return true;
  }

  public recordInvocation(toolName: string, context: any): void {
    const currentTime = Date.now();
    const contextHash = this.getContextHash(context);

    const record: InvocationRecord = {
      timestamp: currentTime,
      toolName: toolName,
      contextHash: contextHash,
    };

    this.history.push(record);

    // Simple cleanup: keep only records from the longest window (global window)
    const globalWindowMs = this.config.globalWindowMs;
    this.history = this.history.filter(
      (record) => record.timestamp >= (currentTime - globalWindowMs)
    );

    this.emit("invocation_recorded", { toolName, record });
  }
}