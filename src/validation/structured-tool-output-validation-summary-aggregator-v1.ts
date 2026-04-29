import {
  ToolResultMessage,
  Message,
} from "./types";

export interface ValidationFailure {
  toolName: string;
  step: string;
  errorType: string;
  severity: "ERROR" | "WARN" | "INFO";
  message: string;
}

export interface AggregatedSummary {
  totalFailures: number;
  failureCounts: Record<string, number>;
  groupedFailures: {
    [key: string]: ValidationFailure[];
  };
  detailedFailures: ValidationFailure[];
}

export class StructuredToolOutputValidationSummaryAggregatorV1 {
  private validationResults: ValidationFailure[];

  constructor(validationResults: ValidationFailure[]) {
    this.validationResults = validationResults;
  }

  private countFailures(failure: ValidationFailure): Record<string, number> {
    const counts: Record<string, number> = {};
    const keys = ["errorType", "severity", "toolName"];
    for (const key of keys) {
      const value = failure[key] as string;
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }

  public aggregate(): AggregatedSummary {
    const detailedFailures: ValidationFailure[] = [];
    const failureCounts: Record<string, number> = {};
    const groupedFailures: Record<string, ValidationFailure[]> = {};

    for (const failure of this.validationResults) {
      detailedFailures.push(failure);

      // Aggregate counts for common patterns
      const counts = this.countFailures(failure);
      for (const key in counts) {
        const count = counts[key];
        if (!failureCounts[key]) {
          failureCounts[key] = 0;
        }
        failureCounts[key] += count;
      }

      // Group by a composite key (e.g., ToolName:Step:ErrorType)
      const groupKey = `${failure.toolName}:${failure.step}:${failure.errorType}`;
      if (!groupedFailures[groupKey]) {
        groupedFailures[groupKey] = [];
      }
      groupedFailures[groupKey].push(failure);
    }

    return {
      totalFailures: detailedFailures.length,
      failureCounts: failureCounts,
      groupedFailures: groupedFailures,
      detailedFailures: detailedFailures,
    };
  }
}