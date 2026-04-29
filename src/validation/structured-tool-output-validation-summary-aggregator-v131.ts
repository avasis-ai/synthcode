import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export type Severity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";

export type AdvancedFailureType =
  | "schema_mismatch"
  | "semantic_mismatch"
  | "temporal_violation"
  | "unknown";

export interface ValidationSummaryEntry {
  toolCallId: string;
  stage: string;
  severity: Severity;
  failureType: AdvancedFailureType;
  message: string;
}

export interface ConsolidatedReport {
  overallSeverity: Severity;
  totalFailures: number;
  failureSummary: Record<AdvancedFailureType, number>;
  detailedFailures: ValidationSummaryEntry[];
  actionableAdvice: string;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private entries: ValidationSummaryEntry[] = [];

  private static getSeverityOrder(severity: Severity): number {
    switch (severity) {
      case "CRITICAL":
        return 3;
      case "ERROR":
        return 2;
      case "WARNING":
        return 1;
      case "INFO":
        return 0;
      default:
        return -1;
    }
  }

  private static getMostSevereSeverity(entries: ValidationSummaryEntry[]): Severity {
    if (entries.length === 0) {
      return "INFO";
    }

    let maxSeverity = "INFO";
    let maxOrder = -1;

    for (const entry of entries) {
      const currentOrder = StructuredToolOutputValidationSummaryAggregator.getSeverityOrder(entry.severity);
      if (currentOrder > maxOrder) {
        maxOrder = currentOrder;
        maxSeverity = entry.severity;
      }
    }
    return maxSeverity;
  }

  public aggregate(entries: ValidationSummaryEntry[]): StructuredToolOutputValidationSummaryAggregator {
    this.entries = [...entries];
    return this;
  }

  public generateConsolidatedReport(): ConsolidatedReport {
    if (this.entries.length === 0) {
      return {
        overallSeverity: "INFO",
        totalFailures: 0,
        failureSummary: {
          schema_mismatch: 0,
          semantic_mismatch: 0,
          temporal_violation: 0,
          unknown: 0,
        },
        detailedFailures: [],
        actionableAdvice: "No validation issues found. Tool outputs appear consistent.",
      };
    }

    const overallSeverity = StructuredToolOutputValidationSummaryAggregator.getMostSevereSeverity(this.entries);
    const failureSummary: Record<AdvancedFailureType, number> = {
      schema_mismatch: 0,
      semantic_mismatch: 0,
      temporal_violation: 0,
      unknown: 0,
    };

    for (const entry of this.entries) {
      failureSummary[entry.failureType] = (failureSummary[entry.failureType] || 0) + 1;
    }

    const totalFailures = this.entries.length;

    let advice: string;
    if (overallSeverity === "CRITICAL") {
      advice = "Immediate human review is required. Critical failures indicate fundamental process breaks.";
    } else if (overallSeverity === "ERROR") {
      advice = "Significant errors detected. Review the detailed report, focusing on schema and semantic mismatches.";
    } else if (overallSeverity === "WARNING") {
      advice = "Minor inconsistencies found. These might require minor prompt adjustments.";
    } else {
      advice = "Validation passed successfully. The process flow is stable.";
    }

    return {
      overallSeverity,
      totalFailures,
      failureSummary,
      detailedFailures: this.entries,
      actionableAdvice: advice,
    };
  }
}