import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

interface Assumption {
  statement: string;
  source: string;
  confidence_weight: number;
}

interface ContextPayload {
  constraints: Record<string, string>;
  history: Message[];
  known_facts: Record<string, any>;
}

interface AssumptionViolation {
  assumption_statement: string;
  violation_reason: string;
  severity: "low" | "medium" | "high";
  conflicts_with: string;
}

interface ValidationReport {
  composite_confidence_score: number;
  is_safe_to_proceed: boolean;
  violations: AssumptionViolation[];
  detailed_report: string;
}

export class ContextualAssumptionValidator {
  private context: ContextPayload;
  private assumptions: Assumption[];

  constructor(context: ContextPayload, assumptions: Assumption[]) {
    this.context = context;
    this.assumptions = assumptions;
  }

  private checkConflict(assumption: Assumption, context: ContextPayload): AssumptionViolation | null {
    const { statement } = assumption;

    // 1. Check against explicit constraints
    for (const [key, constraintValue] of Object.entries(context.constraints)) {
      if (statement.toLowerCase().includes(key.toLowerCase()) && !constraintValue.includes("allowed")) {
        return {
          assumption_statement: statement,
          violation_reason: `Conflicts with hard constraint: ${key} must be ${constraintValue}.`,
          severity: "high",
          conflicts_with: `Constraint: ${key}`,
        };
      }
    }

    // 2. Check against historical data (simple check: does the history contradict the assumption?)
    for (const message of context.history) {
      const content = JSON.stringify(message);
      if (statement.toLowerCase().includes("previous action") && content.toLowerCase().includes("failed")) {
        return {
          assumption_statement: statement,
          violation_reason: `Contradicts historical data: Previous attempts related to this assumption have failed.`,
          severity: "medium",
          conflicts_with: "History",
        };
      }
    }

    // 3. Check against known facts (e.g., if the assumption contradicts a known fact)
    for (const [key, fact] of Object.entries(context.known_facts)) {
      if (statement.toLowerCase().includes(key.toLowerCase()) && typeof fact === 'string' && !fact.toLowerCase().includes("is true")) {
        return {
          assumption_statement: statement,
          violation_reason: `Contradicts known fact: The known fact states ${key} is ${fact}.`,
          severity: "high",
          conflicts_with: `Known Fact: ${key}`,
        };
      }
    }

    return null;
  }

  validate(): ValidationReport {
    const violations: AssumptionViolation[] = [];
    let totalViolationWeight = 0;

    for (const assumption of this.assumptions) {
      const violation = this.checkConflict(assumption, this.context);
      if (violation) {
        violations.push(violation);
        totalViolationWeight += 0.5; // Penalize each violation
      }
    }

    const totalAssumptionWeight = this.assumptions.reduce(
      (sum, a) => sum + a.confidence_weight,
      0
    );

    // Calculate composite confidence score: (Total Weight - Penalty) / Total Weight
    const compositeScore = Math.max(0, 1 - (totalViolationWeight / totalAssumptionWeight));

    const isSafe = violations.length === 0 || compositeScore > 0.7;

    const detailedReport = `Validation complete. Found ${violations.length} conflicts. Composite Confidence Score: ${compositeScore.toFixed(2)}.`;

    return {
      composite_confidence_score: compositeScore,
      is_safe_to_proceed: isSafe,
      violations: violations,
      detailed_report: detailedReport,
    };
  }
}