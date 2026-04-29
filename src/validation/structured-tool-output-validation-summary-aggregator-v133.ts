import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationFailure = {
  type: "schema_drift" | "cross_field_error" | "temporal_violation" | "unknown";
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
  context?: any;
};

export interface AggregatedValidationSummary {
  totalFailures: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  failuresByType: Record<ValidationFailure["type"], ValidationFailure[]>;
  summaryMessage: string;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private readonly validationResults: ValidationFailure[];

  constructor(validationResults: ValidationFailure[]) {
    this.validationResults = validationResults;
  }

  private aggregateFailures(results: ValidationFailure[]): {
    totalFailures: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    failuresByType: Record<ValidationFailure["type"], ValidationFailure[]>;
    summaryMessage: string;
  } {
    const failuresByType: Record<ValidationFailure["type"], ValidationFailure[]> = {
      schema_drift: [],
      cross_field_error: [],
      temporal_violation: [],
      unknown: [],
    };

    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let totalFailures = 0;

    for (const failure of results) {
      failuresByType[failure.type].push(failure);
      totalFailures++;
      if (failure.severity === "error") {
        errorCount++;
      } else if (failure.severity === "warning") {
        warningCount++;
      } else {
        infoCount++;
      }
    }

    const summaryMessage = `Validation Summary: Found ${totalFailures} issues. ${errorCount} critical errors, ${warningCount} warnings, and ${infoCount} informational notes.`;

    return {
      totalFailures,
      errorCount,
      warningCount,
      infoCount,
      failuresByType,
      summaryMessage,
    };
  }

  public aggregate(): AggregatedValidationSummary {
    return this.aggregateFailures(this.validationResults);
  }

  public static build(validationResults: ValidationFailure[]): StructuredToolOutputValidationSummaryAggregator {
    return new StructuredToolOutputValidationSummaryAggregator(validationResults);
  }
}