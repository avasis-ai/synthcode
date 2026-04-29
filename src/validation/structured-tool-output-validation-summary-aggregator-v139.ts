import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export type Severity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";

export interface ConflictDetail {
  conflictType: string;
  severity: Severity;
  description: string;
  suggestedFix: string;
}

export interface ValidationSummaryEntry {
  sourceStage: string;
  isValid: boolean;
  details: string;
  conflicts: ConflictDetail[];
}

export interface ValidationSummary {
  overallConfidenceScore: number;
  totalEntries: number;
  hasCriticalFailures: boolean;
  hasErrors: boolean;
  aggregatedConflicts: ConflictDetail[];
  summary: string;
}

class StructuredToolOutputValidationSummaryAggregator {
  private entries: ValidationSummaryEntry[] = [];

  private static getSeverityWeight(severity: Severity): number {
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
        return 0;
    }
  }

  private static aggregateConflicts(
    existing: ConflictDetail[],
    newConflicts: ConflictDetail[]
  ): ConflictDetail[] {
    const conflictMap = new Map<string, ConflictDetail>();

    const processConflict = (conflict: ConflictDetail) => {
      const key = `${conflict.conflictType}:${conflict.severity}`;
      if (!conflictMap.has(key) || StructuredToolOutputValidationSummaryAggregator.getSeverityWeight(conflict.severity) > StructuredToolOutputValidationSummaryAggregator.getSeverityWeight(conflictMap.get(key)!.severity)) {
        conflictMap.set(key, conflict);
      } else if (StructuredToolOutputValidationSummaryAggregator.getSeverityWeight(conflict.severity) === StructuredToolOutputValidationSummaryAggregator.getSeverityWeight(conflictMap.get(key)!)) {
        // Simple merge for same severity/type: prefer more detailed suggestion
        const existing = conflictMap.get(key)!;
        if (conflict.suggestedFix.length > existing.suggestedFix.length) {
          conflictMap.set(key, { ...existing, suggestedFix: conflict.suggestedFix });
        }
      }
    };

    existing.forEach(processConflict);
    newConflicts.forEach(processConflict);

    return Array.from(conflictMap.values());
  }

  public addEntry(entry: ValidationSummaryEntry): void {
    this.entries.push(entry);
  }

  public aggregate(): ValidationSummary {
    if (this.entries.length === 0) {
      return {
        overallConfidenceScore: 1.0,
        totalEntries: 0,
        hasCriticalFailures: false,
        hasErrors: false,
        aggregatedConflicts: [],
        summary: "No validation entries provided.",
      };
    }

    let allConflicts: ConflictDetail[] = [];
    let hasCritical = false;
    let hasError = false;

    this.entries.forEach((entry) => {
      if (entry.conflicts.length > 0) {
        allConflicts = StructuredToolOutputValidationSummaryAggregator.aggregateConflicts(allConflicts, entry.conflicts);
      }
      if (!entry.isValid) {
        entry.conflicts.forEach(conflict => {
          if (conflict.severity === "CRITICAL") hasCritical = true;
          if (conflict.severity === "ERROR") hasError = true;
        });
      }
    });

    const totalEntries = this.entries.length;
    const criticalCount = allConflicts.filter(c => c.severity === "CRITICAL").length;
    const errorCount = allConflicts.filter(c => c.severity === "ERROR").length;

    const confidenceScore = 1.0 - (
      (criticalCount * 0.3) + (errorCount * 0.15)
    );

    const summary = `Validation completed across ${totalEntries} stages. Found ${criticalCount} critical issues and ${errorCount} errors. Overall confidence is ${Math.round(confidenceScore * 100)}%.`;

    return {
      overallConfidenceScore: Math.max(0.0, Math.min(1.0, confidenceScore)),
      totalEntries: totalEntries,
      hasCriticalFailures: hasCritical,
      hasErrors: hasError,
      aggregatedConflicts: allConflicts,
      summary: summary,
    };
  }
}

export { StructuredToolOutputValidationSummaryAggregator };