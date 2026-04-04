import { EventEmitter } from "events";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

interface ToolCallRateLimiter {
  configure(toolName: string, config: RateLimitConfig): void;
  configureGlobal(config: RateLimitConfig): void;
  acquire(toolName: string | "global"): Promise<void>;
}

class ToolCallRateLimiterImpl implements ToolCallRateLimiter {
  private toolLimits: Map<string, { limit: number; windowMs: number; timestamps: number[] }> = new Map();
  private globalLimit: { limit: number; windowMs: number; timestamps: number[] } = { limit: 0, windowMs: 0, timestamps: [] };

  configure(toolName: string, config: RateLimitConfig): void {
    this.toolLimits.set(toolName, {
      limit: config.limit,
      windowMs: config.windowMs,
      timestamps: [],
    });
  }

  configureGlobal(config: RateLimitConfig): void {
    this.globalLimit = {
      limit: config.limit,
      windowMs: config.windowMs,
      timestamps: [],
    };
  }

  private checkAndRecord(timestamps: number[], limit: number, windowMs: number): boolean {
    const now = Date.now();
    const cutoff = now - windowMs;

    // Clean up old timestamps
    const recentTimestamps = timestamps.filter((ts) => ts > cutoff);
    
    if (recentTimestamps.length >= limit) {
      return false;
    }

    // Record the new attempt
    recentTimestamps.push(now);
    return true;
  }

  private async waitIfNecessary(timestamps: number[], limit: number, windowMs: number): Promise<void> {
    const now = Date.now();
    const cutoff = now - windowMs;

    // Clean up old timestamps
    const recentTimestamps = timestamps.filter((ts) => ts > cutoff);

    if (recentTimestamps.length >= limit) {
      // Calculate time to wait until the oldest request falls out of the window
      const oldestTimestamp = recentTimestamps[0];
      const waitTime = (oldestTimestamp + windowMs) - now;

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    
    // Re-check and record after waiting (or immediately if no wait was needed)
    const newTimestamps = [...recentTimestamps];
    if (newTimestamps.length >= limit) {
        // This case should ideally not happen if waitTime calculation is correct, 
        // but we ensure we don't exceed the limit after waiting.
        newTimestamps.shift(); 
    }
    newTimestamps.push(Date.now());
    
    // Update the internal state (this is a simplification for demonstration; 
    // in a real system, state management would be more robust)
    if (Object.keys(this).includes("toolLimits")) {
        (this as any).toolLimits.set("temp_state", { limit: limit, windowMs: windowMs, timestamps: newTimestamps });
    } else if (Object.keys(this).includes("globalLimit")) {
        (this as any).globalLimit = { limit: limit, windowMs: windowMs, timestamps: newTimestamps };
    }
  }

  async acquire(toolName: string | "global"): Promise<void> {
    let timestamps: number[];
    let limit: number;
    let windowMs: number;

    if (toolName === "global") {
      timestamps = this.globalLimit.timestamps;
      limit = this.globalLimit.limit;
      windowMs = this.globalLimit.windowMs;
    } else {
      const toolState = this.toolLimits.get(toolName);
      if (!toolState) {
        throw new Error(`Rate limit not configured for tool: ${toolName}`);
      }
      timestamps = toolState.timestamps;
      limit = toolState.limit;
      windowMs = toolState.windowMs;
    }

    // Simplified state update for demonstration purposes. 
    // In a real implementation, we'd manage state immutably or use a dedicated store.
    if (toolName === "global") {
        this.globalLimit.timestamps = [...timestamps];
    } else {
        const toolState = this.toolLimits.get(toolName);
        if (toolState) {
             (this as any).toolLimits.set(toolName, { ...toolState, timestamps: [...timestamps] });
        }
    }

    await this.waitIfNecessary(timestamps, limit, windowMs);
  }
}

export const createToolCallRateLimiter = (): ToolCallRateLimiter => {
  return new ToolCallRateLimiterImpl();
};