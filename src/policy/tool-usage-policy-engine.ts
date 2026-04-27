import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

type PolicyAction = "allow" | "warn" | "require_confirmation" | "block";

interface Condition {
  type: "count_exceeded" | "context_match" | "time_window";
  params: Record<string, any>;
}

export interface PolicyRule {
  id: string;
  description: string;
  conditions: Condition[];
  action: PolicyAction;
}

export interface PolicyResult {
  isAllowed: boolean;
  actionTaken: PolicyAction;
  message: string;
  details?: Record<string, any>;
}

interface UsageState {
  count: number;
  lastUsageTimestamp: number;
  // Add other state tracking fields as needed (e.g., userRole, sessionID)
}

export class ToolUsagePolicyEngine {
  private policies: Map<string, PolicyRule> = new Map();
  private stateStore: Map<string, Map<string, UsageState>> = new Map(); // Key: ToolName, Value: Map<ContextKey, UsageState>

  constructor() {}

  addPolicy(policy: PolicyRule): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Simulates retrieving or initializing state for a given tool and context.
   * In a real system, this would interact with Redis or a database.
   * @param toolName The name of the tool being checked.
   * @param contextKey A unique identifier for the context (e.g., userId:sessionId).
   * @returns The current usage state.
   */
  private getState(toolName: string, contextKey: string): UsageState {
    if (!this.stateStore.has(toolName)) {
      this.stateStore.set(toolName, new Map());
    }
    const toolStates = this.stateStore.get(toolName)!;
    if (!toolStates.has(contextKey)) {
      toolStates.set(contextKey, { count: 0, lastUsageTimestamp: Date.now() });
    }
    return toolStates.get(contextKey)!;
  }

  /**
   * Updates the state store after a successful check or usage event.
   * @param toolName The tool name.
   * @param contextKey The context key.
   */
  private updateState(toolName: string, contextKey: string): void {
    const currentState = this.getState(toolName, contextKey);
    currentState.count += 1;
    currentState.lastUsageTimestamp = Date.now();
    // In a real system, we might also implement state cleanup/expiry here.
  }

  /**
   * Evaluates a single condition against the current state.
   */
  private evaluateCondition(condition: Condition, state: UsageState, context: Record<string, unknown>): boolean {
    switch (condition.type) {
      case "count_exceeded":
        const { threshold, windowMinutes } = condition.params;
        const timeLimitMs = windowMinutes * 60 * 1000;
        const timeElapsed = Date.now() - state.lastUsageTimestamp;

        if (timeElapsed > timeLimitMs) {
          // Window reset
          return true; // Condition met (resetting count logic is complex, for simplicity, we just check the count)
        }

        return state.count >= threshold;

      case "context_match":
        const { requiredRole } = condition.params;
        return context.userRole === requiredRole;

      case "time_window":
        const { minutes } = condition.params;
        const timeLimitMs = minutes * 60 * 1000;
        return (Date.now() - state.lastUsageTimestamp) < timeLimitMs;

      default:
        return false;
    }
  }

  /**
   * Checks the provided tool usage against all registered policies.
   * @param toolName The name of the tool being used.
   * @param context Contextual data (e.g., userRole, sessionId).
   * @param usageData Data related to the current usage attempt.
   * @returns A PolicyResult indicating if usage is allowed and what action is required.
   */
  public checkPolicy(toolName: string, context: Record<string, unknown>, usageData: Record<string, unknown>): PolicyResult {
    const contextKey = `${context.userId || 'anon'}:${context.sessionId || 'global'}`;
    const currentState = this.getState(toolName, contextKey);

    for (const policy of this.policies.values()) {
      let allConditionsMet = true;

      for (const condition of policy.conditions) {
        if (!this.evaluateCondition(condition, currentState, context)) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        return {
          isAllowed: false,
          actionTaken: policy.action,
          message: `Policy violation detected: ${policy.description}. Action required: ${policy.action}.`,
          details: { policyId: policy.id, currentState: currentState }
        };
      }
    }

    // If no policies were violated
    this.updateState(toolName, contextKey);
    return {
      isAllowed: true,
      actionTaken: "allow",
      message: "Tool usage is permitted.",
    };
  }
}