import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Severity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";

interface ValidationSummaryEntry {
  validatorName: string;
  ruleId: string;
  severity: Severity;
  message: string;
  context: Record<string, unknown>;
}

interface StructuredValidationSummary {
  totalEntries: number;
  totalFailures: number;
  failureBreakdown: Record<Severity, number>;
  weightedFailureScore: number;
  rootCauseClusters: Record<string, Set<string>>;
  actionableRemediationSteps: string[];
}

class StructuredToolOutputValidationSummaryAggregator {
  private entries: ValidationSummaryEntry[];

  constructor(entries: ValidationSummaryEntry[]) {
    this.entries = entries;
  }

  private calculateWeightedScore(entries: ValidationSummaryEntry[]): number {
    const weights: Record<Severity, number> = {
      CRITICAL: 10,
      ERROR: 5,
      WARNING: 2,
      INFO: 1,
    };
    return entries.reduce((score, entry) => score + (weights[entry.severity] || 0), 0);
  }

  private analyzeRootCauses(entries: ValidationSummaryEntry[]): Record<string, Set<string>> {
    const clusters: Record<string, Set<string>> = {};

    for (const entry of entries) {
      const clusterKey = `${entry.validatorName}:${entry.ruleId}`;
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = new Set();
      }
      clusters[clusterKey].add(entry.severity);
    }
    return clusters;
  }

  private generateRemediationSteps(entries: ValidationSummaryEntry[]): string[] {
    const criticalFailures = entries.filter(e => e.severity === "CRITICAL");
    const errorFailures = entries.filter(e => e.severity === "ERROR");

    const steps: string[] = [];

    if (criticalFailures.length > 0) {
      steps.push(
        `Immediate review required: ${criticalFailures.length} CRITICAL validation failures detected. Check the core structure or mandatory fields.`
      );
    }

    if (errorFailures.length > 0) {
      steps.push(
        `Review data integrity: ${errorFailures.length} ERROR level issues found. Focus on type mismatches or missing optional data.`
      );
    }

    if (steps.length === 0) {
      steps.push("Validation passed successfully. No immediate remediation steps are necessary.");
    }

    return steps;
  }

  public aggregateSummary(): StructuredValidationSummary {
    const totalEntries = this.entries.length;
    const failureBreakdown: Record<Severity, number> = {
      CRITICAL: 0,
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
    };

    for (const entry of this.entries) {
      failureBreakdown[entry.severity] = (failureBreakdown[entry.severity] || 0) + 1;
    }

    const totalFailures = failureBreakdown.CRITICAL + failureBreakdown.ERROR;
    const weightedFailureScore = this.calculateWeightedScore(this.entries);
    const rootCauseClusters = this.analyzeRootCauses(this.entries);
    const actionableRemediationSteps = this.generateRemediationSteps(this.entries);

    return {
      totalEntries,
      totalFailures,
      failureBreakdown,
      weightedFailureScore,
      rootCauseClusters,
      actionableRemediationSteps,
    };
  }
}

export { StructuredToolOutputValidationSummaryAggregator };