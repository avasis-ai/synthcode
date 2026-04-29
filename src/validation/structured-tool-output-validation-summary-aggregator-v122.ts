import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ValidationSummaryEntry {
  toolName: string;
  isValid: boolean;
  errorCount: number;
  warnings: string[];
  details: Record<string, any>;
}

export interface AggregatedValidationSummary {
  totalEntries: number;
  successfulEntries: number;
  failedEntries: number;
  overallSuccessRate: number;
  errorTypeCounts: Record<string, number>;
  summaryReport: {
    issuesFound: number;
    warningsIssued: number;
    details: Record<string, any>;
  };
}

export class StructuredToolOutputValidationSummaryAggregator {
  private entries: ValidationSummaryEntry[];

  constructor(entries: ValidationSummaryEntry[]) {
    this.entries = entries;
  }

  private calculateOverallMetrics(): {
    successfulEntries: number;
    failedEntries: number;
    errorTypeCounts: Record<string, number>;
    totalIssues: number;
    totalWarnings: number;
  } {
    let successfulEntries = 0;
    let failedEntries = 0;
    const errorTypeCounts: Record<string, number> = {};
    let totalIssues = 0;
    let totalWarnings = 0;

    for (const entry of this.entries) {
      if (entry.isValid) {
        successfulEntries++;
      } else {
        failedEntries++;
        totalIssues += entry.errorCount;
      }
      
      // Simple aggregation for error types (assuming error details might contain type info)
      // For this example, we'll just count based on the presence of an error.
      if (entry.errorCount > 0) {
        const errorKey = "validation_failure";
        errorTypeCounts[errorKey] = (errorTypeCounts[errorKey] || 0) + 1;
      }

      totalWarnings += entry.warnings.length;
    }

    return {
      successfulEntries,
      failedEntries,
      errorTypeCounts,
      totalIssues,
      totalWarnings,
    };
  }

  public aggregateSummary(): AggregatedValidationSummary {
    const metrics = this.calculateOverallMetrics();
    const totalEntries = this.entries.length;
    const overallSuccessRate = totalEntries > 0 ? (metrics.successfulEntries / totalEntries) * 100 : 0;

    const summaryReport: AggregatedValidationSummary['summaryReport'] = {
      issuesFound: metrics.totalIssues,
      warningsIssued: metrics.totalWarnings,
      details: {
        allEntries: this.entries.map(e => ({
          toolName: e.toolName,
          isValid: e.isValid,
          errorCount: e.errorCount,
          warnings: e.warnings,
          details: e.details,
        })),
      },
    };

    return {
      totalEntries: totalEntries,
      successfulEntries: metrics.successfulEntries,
      failedEntries: metrics.failedEntries,
      overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
      errorTypeCounts: metrics.errorTypeCounts,
      summaryReport: summaryReport,
    };
  }
}