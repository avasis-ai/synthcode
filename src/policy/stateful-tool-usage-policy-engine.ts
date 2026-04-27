import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface AgentContext {
  sessionId: string;
  // Potentially other context like user ID, etc.
}

interface UsageLimit {
  maxCalls: number;
  windowMs: number; // Time window in milliseconds
}

interface Policy {
  limitKey: string; // e.g., "tool_name:call_count"
  limit: UsageLimit;
}

interface UsageTracker {
  lastCallTime: number;
  callCount: number;
}

type PolicyResult = {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
};

export class StatefulToolUsagePolicyEngine {
  private toolUsageStore: Map<string, Map<string, UsageTracker>>;

  constructor() {
    this.toolUsageStore = new Map();
  }

  private getToolStore(toolId: string): Map<string, UsageTracker> {
    if (!this.toolUsageStore.has(toolId)) {
      this.toolUsageStore.set(toolId, new Map());
    }
    return this.toolUsageStore.get(toolId)!;
  }

  private getTracker(toolId: string, policyKey: string): UsageTracker {
    const toolStore = this.getToolStore(toolId);
    if (!toolStore.has(policyKey)) {
      toolStore.set(policyKey, {
        lastCallTime: 0,
        callCount: 0,
      });
    }
    return toolStore.get(policyKey)!;
  }

  public checkUsage(
    toolId: string,
    policy: Policy,
    context: AgentContext
  ): PolicyResult {
    const { limitKey, limit } = policy;
    const tracker = this.getTracker(toolId, limitKey);
    const now = Date.now();

    const timeElapsed = now - tracker.lastCallTime;

    if (timeElapsed > limit.windowMs) {
      // Window reset
      tracker.callCount = 1;
      tracker.lastCallTime = now;
      return { allowed: true };
    } else {
      // Within window
      if (tracker.callCount < limit.maxCalls) {
        tracker.callCount += 1;
        tracker.lastCallTime = now;
        return { allowed: true };
      } else {
        const retryAfter = Math.ceil((limit.windowMs - timeElapsed) / 1000);
        return {
          allowed: false,
          reason: `Rate limit exceeded for ${toolId}. Try again in ${retryAfter} seconds.`,
          retryAfterSeconds: retryAfter,
        };
      }
    }
  }

  public resetUsage(toolId: string): void {
    const toolStore = this.getToolStore(toolId);
    if (toolStore) {
      toolStore.clear();
    }
  }
}