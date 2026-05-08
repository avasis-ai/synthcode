import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

type ComplianceVerdict = "ALLOW" | "BLOCK" | "MODIFY";

export interface ComplianceResult {
  verdict: ComplianceVerdict;
  modifiedContext?: Record<string, unknown>;
  reason?: string;
}

export interface IComplianceRule {
  name: string;
  validate(context: Record<string, unknown>, action: Message): ComplianceResult;
}

export class ComplianceGate {
  private rules: IComplianceRule[] = [];

  addRule(rule: IComplianceRule): void {
    this.rules.push(rule);
  }

  /**
   * Intercepts a proposed action (Message) and validates it against all registered compliance rules.
   * @param context The current state or context payload.
   * @param action The proposed action (e.g., message to be sent).
   * @returns A ComplianceResult indicating the final verdict and any modifications.
   * @throws Error if the action is definitively blocked by any rule.
   */
  intercept(context: Record<string, unknown>, action: Message): ComplianceResult {
    let finalVerdict: ComplianceVerdict = "ALLOW";
    let accumulatedContext: Record<string, unknown> = { ...context };

    for (const rule of this.rules) {
      const result = rule.validate(accumulatedContext, action);

      if (result.verdict === "BLOCK") {
        throw new Error(`Compliance Blocked by ${rule.name}: ${result.reason || "Unknown policy violation."}`);
      }

      if (result.verdict === "MODIFY") {
        // Modification takes precedence over simple allowance, but we continue checking other rules
        // to ensure no other rule blocks the modified action.
        accumulatedContext = result.modifiedContext || accumulatedContext;
        finalVerdict = "MODIFY";
      }
    }

    return {
      verdict: finalVerdict,
      modifiedContext: accumulatedContext,
      reason: finalVerdict === "MODIFY" ? "Action modified by compliance rules." : "Action passed compliance checks."
    };
  }
}