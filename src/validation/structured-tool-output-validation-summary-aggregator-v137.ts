import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Severity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";

interface ValidationSummaryEntry {
  severity: Severity;
  description: string;
  contextTags: string[];
  weight: number;
}

interface ValidationSummary {
  overallScore: number;
  action: "RETRY" | "WARN" | "FAIL" | "PASS";
  summaryDetails: string;
  weightedFailureCount: number;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private readonly SEVERITY_WEIGHTS: Record<Severity, number> = {
    CRITICAL: 5,
    ERROR: 3,
    WARNING: 1,
    INFO: 0,
  };

  private readonly ACTION_THRESHOLD: {
    score: number;
    action: "RETRY" | "WARN" | "FAIL" | "PASS";
  } = {
    score: 10,
    action: "FAIL",
  };

  private readonly WARNING_THRESHOLD: {
    score: number;
    action: "WARN" | "RETRY";
  } = {
    score: 3,
    action: "WARN",
  };

  private readonly PASS_THRESHOLD: {
    score: number;
    action: "PASS";
  } = {
    score: 0,
    action: "PASS",
  };

  aggregate(entries: ValidationSummaryEntry[]): ValidationSummary {
    if (!entries || entries.length === 0) {
      return {
        overallScore: 0,
        action: "PASS",
        summaryDetails: "No validation entries provided.",
        weightedFailureCount: 0,
      };
    }

    let totalScore = 0;
    let weightedFailureCount = 0;
    const detailMap: Map<string, string[]> = new Map();

    for (const entry of entries) {
      const weight = entry.weight * (this.SEVERITY_WEIGHTS[entry.severity] || 1);
      totalScore += weight;
      weightedFailureCount += (entry.severity === "CRITICAL" || entry.severity === "ERROR") ? 1 : 0;

      const key = entry.severity;
      if (!detailMap.has(key)) {
        detailMap.set(key, []);
      }
      detailMap.get(key)!.push(entry.description);
    }

    const action = this.determineAction(totalScore, weightedFailureCount);
    const summaryDetails = this.generateSummaryDetails(detailMap);

    return {
      overallScore: parseFloat(totalScore.toFixed(2)),
      action: action,
      summaryDetails: summaryDetails,
      weightedFailureCount: weightedFailureCount,
    };
  }

  private determineAction(score: number, failureCount: number): "RETRY" | "WARN" | "FAIL" | "PASS" {
    if (failureCount >= 2 || score >= this.ACTION_THRESHOLD.score) {
      return this.ACTION_THRESHOLD.action;
    }
    if (score >= this.WARNING_THRESHOLD.score) {
      return this.WARNING_THRESHOLD.action;
    }
    return this.PASS_THRESHOLD.action;
  }

  private generateSummaryDetails(detailMap: Map<string, string[]>): string {
    const parts: string[] = [];
    const sortedSeverities: Severity[] = ["CRITICAL", "ERROR", "WARNING", "INFO"];

    for (const severity of sortedSeverities) {
      if (detailMap.has(severity)) {
        const descriptions = detailMap.get(severity)!;
        const summary = descriptions.join("; ");
        parts.push(`[${severity}]: ${summary}`);
      }
    }
    return parts.join("\n");
  }
}