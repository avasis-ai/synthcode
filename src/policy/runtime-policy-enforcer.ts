import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ResourceMetrics = {
  costEstimate: number;
  timeWindowSeconds: number;
  resourceUsage: Record<string, number>;
};

type ExecutionContext = {
  history: Message[];
  currentStep: string;
  state: Record<string, unknown>;
};

type ProposedAction = {
  type: "tool_call" | "text_response" | "sequence";
  details: Record<string, unknown>;
};

type ValidationResult = {
  isValid: boolean;
  message: string;
  modifiedAction?: ProposedAction;
};

export interface PolicyRule {
  name: string;
  validate(
    context: ExecutionContext,
    metrics: ResourceMetrics,
    action: ProposedAction
  ): ValidationResult;
}

export interface FallbackStrategy {
  name: string;
  execute(
    context: ExecutionContext,
    originalAction: ProposedAction,
    failureReason: string
  ): ProposedAction;
}

export class PolicyEnforcer {
  private rules: PolicyRule[];
  private fallbacks: FallbackStrategy[];

  constructor(rules: PolicyRule[], fallbacks: FallbackStrategy[]) {
    this.rules = rules;
    this.fallbacks = fallbacks;
  }

  private getFallback(failureReason: string): ProposedAction | null {
    for (const fallback of this.fallbacks) {
      // Simple strategy: use the first fallback that seems relevant or just use the first one.
      // In a real system, fallbacks would be matched to failure types.
      return fallback.execute(
        { history: [], currentStep: "fallback", state: {} },
        { type: "sequence", details: {} },
        failureReason
      );
    }
    return null;
  }

  public enforce(
    context: ExecutionContext,
    metrics: ResourceMetrics,
    proposedAction: ProposedAction
  ): {
    finalAction: ProposedAction;
    policyViolations: string[];
  } {
    let currentAction: ProposedAction = proposedAction;
    const violations: string[] = [];

    for (const rule of this.rules) {
      const result = rule.validate(context, metrics, currentAction);

      if (!result.isValid) {
        violations.push(`${rule.name}: ${result.message}`);

        // If a policy fails, we attempt to modify the action or trigger a fallback.
        if (result.modifiedAction) {
          currentAction = result.modifiedAction;
        } else {
          // If no modification is provided, use the general fallback mechanism.
          const fallbackAction = this.getFallback(result.message);
          if (fallbackAction) {
            currentAction = fallbackAction;
          } else {
            // If all else fails, we might halt execution or use a default safe action.
            console.warn("Policy violation detected and no fallback applied. Using original action.");
          }
        }
      }
    }

    return {
      finalAction: currentAction,
      policyViolations: violations,
    };
  }
}