import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type PolicyScope = "global" | "session" | "tool";
export type PolicySource = "external_system" | "maintenance" | "emergency";

export interface PolicyRule {
  key: string;
  value: any;
  description: string;
}

export interface ExternalPolicy {
  source: PolicySource;
  scope: PolicyScope;
  durationMs: number;
  isActive: boolean;
  rules: PolicyRule[];
  reason: string;
}

export class ExternalPolicyInjector {
  private currentPolicies: ExternalPolicy[] = [];

  private validatePolicy(policy: ExternalPolicy): boolean {
    if (!policy.isActive) {
      return false;
    }
    if (policy.durationMs <= 0) {
      return false;
    }
    if (policy.source === "external_system" && !policy.rules.length) {
      return false;
    }
    return true;
  }

  public injectPolicy(policy: ExternalPolicy): boolean {
    if (!this.validatePolicy(policy)) {
      return false;
    }
    this.currentPolicies.push(policy);
    return true;
  }

  public clearPolicy(source: PolicySource): boolean {
    const initialLength = this.currentPolicies.length;
    this.currentPolicies = this.currentPolicies.filter(p => p.source !== source);
    return this.currentPolicies.length < initialLength;
  }

  public getActivePolicies(): ExternalPolicy[] {
    return [...this.currentPolicies];
  }

  /**
   * Applies the current set of active policies to a given context or validation step.
   * This simulates overriding or augmenting internal constraints.
   * @param context A placeholder for the current execution context (e.g., user input, tool call).
   * @returns An array of overrides or constraints derived from the policies.
   */
  public applyPolicy(context: Record<string, unknown>): Record<string, unknown> {
    const overrides: Record<string, unknown> = {};
    
    for (const policy of this.currentPolicies) {
      for (const rule of policy.rules) {
        // Policy rules take precedence over standard context values
        overrides[rule.key] = rule.value;
      }
    }
    return overrides;
  }

  /**
   * Checks if the current context violates any active policy constraints.
   * This is a simplified check for demonstration.
   * @param context The context being validated.
   * @returns True if the context is compliant with all active policies, false otherwise.
   */
  public isContextCompliant(context: Record<string, unknown>): boolean {
    for (const policy of this.currentPolicies) {
      for (const rule of policy.rules) {
        const contextValue = context[rule.key];
        
        // Simple compliance check: if the context value is explicitly different from the required rule value
        if (contextValue !== undefined && contextValue !== rule.value) {
          // In a real system, this would involve complex type checking and comparison logic
          console.warn(`Policy Violation Detected: ${rule.key} expected ${rule.value}, got ${contextValue}`);
          return false;
        }
      }
    }
    return true;
  }
}