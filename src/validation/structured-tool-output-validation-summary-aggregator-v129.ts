import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationSummaryEntry {
  ruleId: string;
  fieldPath: string;
  message: string;
  severity: "error" | "warning" | "info";
  source: string;
}

export interface ValidationResult {
  ruleId: string;
  fieldPath: string;
  severity: "error" | "warning" | "info";
  message: string;
  source: string;
}

export interface ValidationSummary {
  totalResults: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  uniqueErrorTypes: Set<string>;
  aggregatedEntries: ValidationSummaryEntry[];
}

export interface ValidationReport {
  summary: ValidationSummary;
  detailedFindings: ValidationSummaryEntry[];
  overallStatus: "PASS" | "FAIL" | "WARNING";
}

export class StructuredToolOutputValidationSummaryAggregator {
  private aggregatedEntries: Map<string, ValidationSummaryEntry> = new Map();
  private uniqueErrorTypes: Set<string> = new Set();

  aggregate(results: ValidationResult[]): ValidationSummary {
    this.aggregatedEntries.clear();
    this.uniqueErrorTypes.clear();

    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const result of results) {
      const entry: ValidationSummaryEntry = {
        ruleId: result.ruleId,
        fieldPath: result.fieldPath,
        message: result.message,
        severity: result.severity,
        source: result.source,
      };

      const key = `${result.ruleId}:${result.fieldPath}:${result.severity}`;

      if (!this.aggregatedEntries.has(key)) {
        this.aggregatedEntries.set(key, entry);
      } else {
        // Simple merging logic: keep the first encountered entry for simplicity,
        // or implement a more complex merge if needed.
      }

      if (result.severity === "error") {
        errorCount++;
        this.uniqueErrorTypes.add(`ERROR:${result.ruleId}`);
      } else if (result.severity === "warning") {
        warningCount++;
        this.uniqueErrorTypes.add(`WARNING:${result.ruleId}`);
      } else {
        infoCount++;
      }
    }

    const summary: ValidationSummary = {
      totalResults: results.length,
      errorCount: errorCount,
      warningCount: warningCount,
      infoCount: infoCount,
      uniqueErrorTypes: this.uniqueErrorTypes,
      aggregatedEntries: Array.from(this.aggregatedEntries.values()),
    };

    return summary;
  }

  generateReport(summary: ValidationSummary): ValidationReport {
    const detailedFindings: ValidationSummaryEntry[] = summary.aggregatedEntries;
    let overallStatus: "PASS" | "FAIL" | "WARNING" = "PASS";

    if (summary.errorCount > 0) {
      overallStatus = "FAIL";
    } else if (summary.warningCount > 0) {
      overallStatus = "WARNING";
    }

    const report: ValidationReport = {
      summary: summary,
      detailedFindings: detailedFindings,
      overallStatus: overallStatus,
    };

    return report;
  }
}