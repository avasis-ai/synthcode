import {
  ToolCall,
  AgentContext,
  PolicyResult,
  PolicyRule,
  ToolUseContext,
} from "./types";

export class StatefulToolUsagePolicyEngineV6 {
  private rules: PolicyRule[];
  private stateStore: Map<string, Record<string, any>>;

  constructor(initialRules: PolicyRule[] = []) {
    this.rules = initialRules;
    this.stateStore = new Map<string, Record<string, any>>();
  }

  public addRule(rule: PolicyRule): void {
    this.rules.push(rule);
  }

  public updateState(contextId: string, newState: Record<string, any>): void {
    this.stateStore.set(contextId, {
      ...(this.stateStore.get(contextId) || {}),
      ...newState,
    });
  }

  public checkUsage(
    toolCall: ToolCall,
    context: AgentContext
  ): PolicyResult {
    const contextId = context.sessionId || "default_session";
    let finalResult: PolicyResult = {
      allowed: true,
      reason: "Usage permitted by all active policies.",
      adjustments: [],
      contextUpdates: {},
    };

    for (const rule of this.rules) {
      const ruleState = this.stateStore.get(contextId) || {};
      const ruleCheck = rule.check(
        toolCall,
        context,
        ruleState
      );

      if (!ruleCheck.allowed) {
        finalResult = {
          allowed: false,
          reason: `Denied by ${rule.name}: ${ruleCheck.reason}`,
          adjustments: [],
          contextUpdates: {},
        };
        return finalResult;
      }

      // Aggregate adjustments and context updates
      finalResult.adjustments.push(...ruleCheck.adjustments);
      finalResult.contextUpdates = {
        ...(finalResult.contextUpdates as Record<string, any>),
        ...(ruleCheck.contextUpdates as Record<string, any>),
      };
    }

    // Apply state updates derived from successful checks
    this.updateState(contextId, finalResult.contextUpdates);

    return {
      ...finalResult,
      contextUpdates: finalResult.contextUpdates,
    };
  }
}