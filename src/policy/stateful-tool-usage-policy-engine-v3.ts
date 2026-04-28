import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ToolCall {
  toolName: string;
  input: Record<string, unknown>;
}

export type PolicyAction = "ALLOW" | "DENY" | "COOLDOWN_REQUIRED";

export interface PolicyResult {
  action: PolicyAction;
  message: string;
  cooldownDurationMs?: number;
}

export interface AgentContext {
  userId: string;
  userTier: "free" | "paid" | "enterprise";
  // Add other context fields as needed, e.g., current session ID
}

export interface UsageHistory {
  timestamp: number;
  toolName: string;
}

export interface PolicyState {
  history: UsageHistory[];
  // Resource constraints map: toolName -> last usage time
  lastUsage: Map<string, number>;
  // Tool specific counters/limits
  toolCounters: Map<string, number>;
}

export interface PolicyRule {
  name: string;
  // The core evaluation logic. Receives current state, context, and the proposed call.
  evaluate(state: PolicyState, context: AgentContext, toolCall: ToolCall): {
    action: PolicyAction;
    message: string;
    cooldownDurationMs?: number;
    newStateUpdates: Partial<PolicyState>;
  };
}

class StatefulToolUsagePolicyEngineV3 {
  private rules: PolicyRule[] = [];
  private state: PolicyState;

  constructor(initialState: PolicyState) {
    this.state = initialState;
  }

  addRule(rule: PolicyRule): void {
    this.rules.push(rule);
  }

  private getCooldownStateUpdate(toolName: string, durationMs: number): Partial<PolicyState> {
    return {
      lastUsage: new Map(this.state.lastUsage).set(toolName, Date.now() + durationMs),
    };
  }

  private checkRateLimit(
    toolName: string,
    history: UsageHistory[],
    context: AgentContext,
  ): {
    action: PolicyAction;
    message: string;
    cooldownDurationMs?: number;
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentCalls = history.filter(
      (h) => h.toolName === toolName && h.timestamp >= oneHourAgo,
    );

    if (recentCalls.length > 5 && context.userTier === "free") {
      return {
        action: "COOLDOWN_REQUIRED",
        message: "Rate limit exceeded for this tool on the free tier. Mandatory 10-minute cooldown enforced.",
        cooldownDurationMs: 10 * 60 * 1000,
      };
    }
    return { action: "ALLOW", message: "", cooldownDurationMs: undefined };
  }

  evaluate(toolCall: ToolCall, context: AgentContext): PolicyResult {
    let currentState = {
      history: [...this.state.history],
      lastUsage: new Map(this.state.lastUsage),
      toolCounters: new Map(this.state.toolCounters),
    };

    let finalResult: PolicyResult = { action: "ALLOW", message: "Policy checks passed." };
    let accumulatedUpdates: Partial<PolicyState> = {};

    for (const rule of this.rules) {
      const ruleResult = rule.evaluate(currentState, context, toolCall);

      if (ruleResult.action === "DENY") {
        return {
          action: "DENY",
          message: ruleResult.message,
        };
      }

      if (ruleResult.action === "COOLDOWN_REQUIRED") {
        // If any rule requires cooldown, we prioritize the most restrictive one
        if (!finalResult.cooldownDurationMs || ruleResult.cooldownDurationMs! > finalResult.cooldownDurationMs!) {
          finalResult = {
            action: "COOLDOWN_REQUIRED",
            message: ruleResult.message,
            cooldownDurationMs: ruleResult.cooldownDurationMs,
          };
        }
      }

      // Merge state updates from rules
      accumulatedUpdates = {
        ...(accumulatedUpdates as any),
        ...(ruleResult.newStateUpdates as any),
      };
    }

    // Apply the rate limit check as a final, mandatory check
    const rateLimitCheck = this.checkRateLimit(
      toolCall.toolName,
      currentState.history,
      context,
    );

    if (rateLimitCheck.action === "DENY") {
      return { action: "DENY", message: rateLimitCheck.message };
    }

    if (rateLimitCheck.action === "COOLDOWN_REQUIRED") {
      if (!finalResult.cooldownDurationMs || rateLimitCheck.cooldownDurationMs! > finalResult.cooldownDurationMs!) {
        finalResult = {
          action: "COOLDOWN_REQUIRED",
          message: rateLimitCheck.message,
          cooldownDurationMs: rateLimitCheck.cooldownDurationMs,
        };
      }
    }

    // Update the internal state only if no DENY action occurred
    this.state = {
      ...this.state,
      ...accumulatedUpdates,
    };

    return finalResult;
  }

  updateState(newState: Partial<PolicyState>): void {
    this.state = {
      ...this.state,
      ...(newState as Partial<PolicyState>),
    };
  }
}

export { StatefulToolUsagePolicyEngineV3 };