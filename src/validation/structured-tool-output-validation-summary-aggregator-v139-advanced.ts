import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  Message,
} from "./types";

interface ValidationError {
  source: string;
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
}

interface ValidationResult {
  sourceId: string;
  results: ValidationError[];
}

interface ErrorSeverityDistribution {
  error: number;
  warning: number;
  info: number;
}

interface ConflictResolutionMetadata {
  conflictsDetected: boolean;
  resolutionStrategy: "none" | "merge" | "override";
  details?: string;
}

export interface AggregatedValidationSummary {
  totalResultsProcessed: number;
  totalErrors: number;
  totalWarnings: number;
  errorDistribution: ErrorSeverityDistribution;
  warningDistribution: ErrorSeverityDistribution;
  conflictMetadata: ConflictResolutionMetadata;
  summaryReport: string;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private results: ValidationResult[];

  constructor(results: ValidationResult[]) {
    this.results = results;
  }

  private calculateDistribution(results: ValidationResult[]): {
    error: number;
    warning: number;
    info: number;
  } {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const result of results) {
      for (const validationError of result.results) {
        switch (validationError.severity) {
          case "error":
            errorCount++;
            break;
          case "warning":
            warningCount++;
            break;
          case "info":
            infoCount++;
            break;
        }
      }
    }
    return { error: errorCount, warning: warningCount, info: infoCount };
  }

  private mergeAndCalculateConflicts(results: ValidationResult[]): {
    conflictsDetected: boolean;
    resolutionStrategy: "none" | "merge" | "override";
    details?: string;
  } {
    let conflictsDetected = false;
    let resolutionStrategy: "none" | "merge" | "override" = "none";
    let conflictDetails: string | undefined = undefined;

    // Simple conflict detection: if multiple sources report errors on the same field
    const fieldErrorMap = new Map<string, Set<string>>();
    for (const result of results) {
      for (const validationError of result.results) {
        const key = `${result.sourceId}:${validationError.field}`;
        if (!fieldErrorMap.has(key)) {
          fieldErrorMap.set(key, new Set());
        }
        fieldErrorMap.get(key)!.add(validationError.message);
      }
    }

    for (const messages of fieldErrorMap.values()) {
      if (messages.size > 1) {
        conflictsDetected = true;
        if (resolutionStrategy === "none") {
          resolutionStrategy = "merge";
        }
        conflictDetails = conflictDetails || "Multiple sources reported conflicting data for a field.";
      }
    }

    return {
      conflictsDetected,
      resolutionStrategy,
      details: conflictDetails,
    };
  }

  public aggregate(): AggregatedValidationSummary {
    const totalResultsProcessed = this.results.length;
    const { error: totalErrors, warning: totalWarnings, info: totalInfos } = this.calculateDistribution(this.results);
    const conflictMetadata = this.mergeAndCalculateConflicts(this.results);

    const errorDistribution: ErrorSeverityDistribution = { error: totalErrors, warning: 0, info: 0 };
    const warningDistribution: ErrorSeverityDistribution = { error: 0, warning: totalWarnings, info: 0 };

    const summaryReport = this.generateHumanReadableReport(
      totalResultsProcessed,
      totalErrors,
      totalWarnings,
      totalInfos,
      errorDistribution,
      warningDistribution,
      conflictMetadata
    );

    return {
      totalResultsProcessed,
      totalErrors: totalErrors,
      totalWarnings: totalWarnings,
      errorDistribution: { error: totalErrors, warning: 0, info: 0 },
      warningDistribution: { error: 0, warning: totalWarnings, info: 0 },
      conflictMetadata: conflictMetadata,
      summaryReport: summaryReport,
    };
  }

  private generateHumanReadableReport(
    totalResults: number,
    totalErrors: number,
    totalWarnings: number,
    totalInfos: number,
    errorDist: ErrorSeverityDistribution,
    warningDist: ErrorSeverityDistribution,
    conflictMeta: {
      conflictsDetected: boolean;
      resolutionStrategy: "none" | "merge" | "override";
      details?: string;
    }
  ): string {
    let report = `--- Validation Summary Report ---\n`;
    report += `Total Validation Runs Processed: ${totalResults}\n`;
    report += `Overall Status: ${totalErrors === 0 ? "SUCCESS" : "FAILURE"}\n`;
    report += `Summary Counts: Errors=${totalErrors}, Warnings=${totalWarnings}, Info=${totalInfos}\n`;

    report += "\n[Severity Breakdown]\n";
    report += `  Errors: ${errorDist.error} (Total)\n`;
    report += `  Warnings: ${warningDist.warning} (Total)\n`;

    report += "\n[Conflict Analysis]\n";
    if (conflictMeta.conflictsDetected) {
      report += `  Status: CONFLICTS DETECTED\n`;
      report += `  Strategy Applied: ${conflictMeta.resolutionStrategy.toUpperCase()}\n`;
      report += `  Details: ${conflictMeta.details || "No specific details provided."}\n`;
    } else {
      report += "  Status: No significant data conflicts detected across sources.\n";
    }

    report += "\n--- End of Report ---";
    return report;
  }
}