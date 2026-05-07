import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FeedbackPayload {
  source: string;
  suggested_change: string;
  confidence_score: number;
  related_message_id?: string;
}

export interface AgentContext {
  current_goal: string;
  safety_policies: Record<string, string>;
  history: Message[];
  state: Record<string, any>;
}

export interface ConflictDetail {
  validator_name: string;
  severity: Severity;
  conflict_description: string;
  recommended_action: string;
}

export interface ConflictReport {
  is_safe: boolean;
  conflicts: ConflictDetail[];
  summary: string;
}

export interface ConflictRuleValidator {
  validate(payload: FeedbackPayload, context: AgentContext): ConflictDetail | null;
  get_name(): string;
}

class GoalConflictValidator implements ConflictRuleValidator {
  get_name(): string {
    return "GoalConflictValidator";
  }

  validate(payload: FeedbackPayload, context: AgentContext): ConflictDetail | null {
    if (payload.suggested_change.toLowerCase().includes("ignore goal")) {
      return {
        validator_name: this.get_name(),
        severity: "CRITICAL",
        conflict_description: "External feedback explicitly suggests ignoring the current primary goal.",
        recommended_action: "Require human confirmation or escalate to a supervisor.",
      };
    }
    return null;
  }
}

class SafetyConstraintValidator implements ConflictRuleValidator {
  get_name(): string {
    return "SafetyConstraintValidator";
  }

  validate(payload: FeedbackPayload, context: AgentContext): ConflictDetail | null {
    const forbiddenKeywords = ["harmful", "illegal", "dangerous"];
    const lowerPayload = payload.suggested_change.toLowerCase();

    for (const keyword of forbiddenKeywords) {
      if (lowerPayload.includes(keyword)) {
        return {
          validator_name: this.get_name(),
          severity: "CRITICAL",
          conflict_description: `Feedback contains potentially unsafe content related to '${keyword}'.`,
          recommended_action: "Reject feedback immediately and log for policy review.",
        };
      }
    }
    return null;
  }
}

class ContextualDriftValidator implements ConflictRuleValidator {
  get_name(): string {
    return "ContextualDriftValidator";
  }

  validate(payload: FeedbackPayload, context: AgentContext): ConflictDetail | null {
    if (payload.confidence_score < 0.5 && context.history.length > 3) {
      return {
        validator_name: this.get_name(),
        severity: "MEDIUM",
        conflict_description: "Low confidence score combined with deep context history suggests potential drift or irrelevance.",
        recommended_action: "Flag for manual review; consider limiting scope of change.",
      };
    }
    return null;
  }
}

export class ExternalFeedbackValidator {
  private validators: ConflictRuleValidator[];

  constructor() {
    this.validators = [
      new GoalConflictValidator(),
      new SafetyConstraintValidator(),
      new ContextualDriftValidator(),
    ];
  }

  private generateConflictReport(conflicts: ConflictDetail[]): ConflictReport {
    const isSafe = conflicts.length === 0;
    let summary = "Validation successful. No conflicts detected.";

    if (!isSafe) {
      const criticalConflicts = conflicts.filter(c => c.severity === "CRITICAL");
      if (criticalConflicts.length > 0) {
        summary = `Validation failed due to ${criticalConflicts.length} critical conflict(s). Action required.`;
      } else {
        summary = `Validation flagged ${conflicts.length} potential conflicts. Proceed with caution.`;
      }
    }

    return {
      is_safe: isSafe,
      conflicts: conflicts,
      summary: summary,
    };
  }

  validate(payload: FeedbackPayload, context: AgentContext): ConflictReport {
    const conflicts: ConflictDetail[] = [];

    for (const validator of this.validators) {
      const conflict = validator.validate(payload, context);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return this.generateConflictReport(conflicts);
  }
}