import { Message, ToolResultMessage } from "./types";

export interface AggregatedValidationSummary {
  overallSuccess: boolean;
  totalChecks: number;
  failedChecks: number;
  summaryBySeverity: Record<"INFO" | "WARN" | "ERROR" | "CRITICAL", number>;
  correlatedFailures: {
    stepId: string;
    primaryError: string;
    relatedErrors: string[];
    severity: "ERROR" | "CRITICAL";
  }[];
  detailedFailures: Record<string, {
    count: number;
    firstError: string;
    lastError: string;
  }>;
}

export interface ValidationResult {
  stepId: string;
  toolCallId: string;
  isValid: boolean;
  errors: {
    code: string;
    message: string;
    severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  }[];
}

export class StructuredToolOutputValidationSummaryAggregatorV130 {
  private results: ValidationResult[];

  constructor(results: ValidationResult[]) {
    this.results = results;
  }

  private aggregateSeverityCounts(results: ValidationResult[]): Record<"INFO" | "WARN" | "ERROR" | "CRITICAL", number> {
    const counts: Record<"INFO" | "WARN" | "ERROR" | "CRITICAL", number> = {
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      CRITICAL: 0,
    };

    for (const result of results) {
      for (const error of result.errors) {
        counts[error.severity] = (counts[error.severity] || 0) + 1;
      }
    }
    return counts;
  }

  private findCorrelatedFailures(results: ValidationResult[]): {
    stepId: string;
    primaryError: string;
    relatedErrors: string[];
    severity: "ERROR" | "CRITICAL";
  }[] {
    const correlations: {
      stepId: string;
      primaryError: string;
      relatedErrors: string[];
      severity: "ERROR" | "CRITICAL";
    }[] = [];

    for (const result of results) {
      if (!result.isValid) {
        const criticalErrors = result.errors.filter(e => e.severity === "CRITICAL" || e.severity === "ERROR");
        if (criticalErrors.length > 0) {
          const primary = criticalErrors[0];
          const related = criticalErrors.filter(e => e !== primary).map(e => e.message);
          correlations.push({
            stepId: result.stepId,
            primaryError: primary.message,
            relatedErrors: related.map(msg => msg),
            severity: primary.severity === "CRITICAL" ? "CRITICAL" : "ERROR",
          });
        }
      }
    }
    return correlations;
  }

  private buildDetailedFailures(results: ValidationResult[]): Record<string, {
    count: number;
    firstError: string;
    lastError: string;
  }> {
    const failures: Record<string, {
      count: number;
      firstError: string;
      lastError: string;
    }> = {};

    for (const result of results) {
      for (const error of result.errors) {
        const key = `${result.stepId}:${error.code}`;
        if (!failures[key]) {
          failures[key] = {
            count: 1,
            firstError: error.message,
            lastError: error.message,
          };
        } else {
          failures[key] = {
            count: failures[key].count + 1,
            firstError: failures[key].firstError,
            lastError: error.message,
          };
        }
      }
    }
    return failures;
  }

  public aggregate(): AggregatedValidationSummary {
    const totalChecks = this.results.length;
    const failedChecks = this.results.filter(r => !r.isValid).length;
    const summaryBySeverity = this.aggregateSeverityCounts(this.results);
    const correlatedFailures = this.findCorrelatedFailures(this.results);
    const detailedFailures = this.buildDetailedFailures(this.results);

    return {
      overallSuccess: failedChecks === 0,
      totalChecks: totalChecks,
      failedChecks: failedChecks,
      summaryBySeverity: summaryBySeverity,
      correlatedFailures: correlatedFailures,
      detailedFailures: detailedFailures,
    };
  }
}