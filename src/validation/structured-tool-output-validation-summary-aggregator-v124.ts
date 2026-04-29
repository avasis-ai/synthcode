import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ValidationSummaryEntry {
  checkName: string;
  isValid: boolean;
  severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  failureReason?: string;
  details?: Record<string, any>;
}

export interface ValidationSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  overallSuccessRate: number;
  failurePatternCounts: Record<string, number>;
  detailedEntries: ValidationSummaryEntry[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private results: ValidationSummaryEntry[];

  constructor() {
    this.results = [];
  }

  public aggregate(validationResults: ValidationSummaryEntry[]): ValidationSummary {
    this.results.push(...validationResults);

    const totalChecks = this.results.length;
    const failedChecks = this.results.filter(
      (entry) => !entry.isValid
    ).length;
    const passedChecks = totalChecks - failedChecks;
    const overallSuccessRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

    const failurePatternCounts: Record<string, number> = this.results.reduce(
      (acc, entry) => {
        if (!entry.isValid && entry.failureReason) {
          const pattern = entry.failureReason.substring(0, 50).trim();
          acc[pattern] = (acc[pattern] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
      failurePatternCounts,
      detailedEntries: [...this.results],
    };
  }

  public serializeSummary(summary: ValidationSummary): string {
    const report = {
      summaryReport: {
        totalChecks: summary.totalChecks,
        passedChecks: summary.passedChecks,
        failedChecks: summary.failedChecks,
        overallSuccessRate: `${summary.overallSuccessRate}%`,
        failurePatternSummary: summary.failurePatternCounts,
      },
      detailedFindings: summary.detailedEntries.map(
        (entry) => ({
          checkName: entry.checkName,
          isValid: entry.isValid,
          severity: entry.severity,
          failureReason: entry.failureReason,
          details: entry.details,
        })
      ),
    };
    return JSON.stringify(report, null, 2);
  }
}