import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationFailure {
  field: string;
  issue: string;
  severity: "error" | "warning" | "info";
  sourcePipeline: string;
}

export interface ValidationSummary {
  overallStatus: "SUCCESS" | "WARNING" | "FAILURE";
  totalFailures: number;
  failures: ValidationFailure[];
  metadata: {
    sources: string[];
    aggregationTimestamp: number;
  };
}

export interface AggregatorOptions {
  failurePriority: {
    [key: string]: "error" | "warning" | "info";
  };
}

export class StructuredToolOutputValidationSummaryAggregator {
  private readonly options: AggregatorOptions;

  constructor(options: AggregatorOptions = {
    failurePriority: {
      "schema_drift": "error";
      "type_mismatch": "warning";
      "missing_field": "error";
    },
  }) {
    this.options = options;
  }

  private resolveFailureSeverity(failure: ValidationFailure): "error" | "warning" | "info" {
    const source = failure.sourcePipeline;
    const issueType = failure.issue.toLowerCase().replace(/[^a-z0-9]+/g, "_");

    if (this.options.failurePriority[source as keyof typeof this.options.failurePriority]) {
      const explicitPriority = this.options.failurePriority[source as keyof typeof this.options.failurePriority];
      if (explicitPriority === "error" && failure.severity !== "error") {
        return "error";
      }
    }

    return failure.severity;
  }

  private aggregateFailures(
    allFailures: ValidationFailure[],
  ): ValidationFailure[] {
    const uniqueFailuresMap = new Map<string, ValidationFailure>();

    for (const failure of allFailures) {
      const key = `${failure.field}:${failure.issue}:${failure.sourcePipeline}`;
      const existingFailure = uniqueFailuresMap.get(key);

      if (!existingFailure || this.shouldOverwrite(existingFailure, failure)) {
        uniqueFailuresMap.set(key, failure);
      }
    }

    return Array.from(uniqueFailuresMap.values());
  }

  private shouldOverwrite(existing: ValidationFailure, incoming: ValidationFailure): boolean {
    const incomingSeverity = this.resolveFailureSeverity(incoming);
    const existingSeverity = this.resolveFailureSeverity(existing);

    if (incomingSeverity === "error" && existingSeverity !== "error") {
      return true;
    }
    if (incomingSeverity === "warning" && existingSeverity === "info") {
      return true;
    }
    return false;
  }

  public aggregate(
    validationSummaries: {
      failures: ValidationFailure[];
      metadata: {
        source: string;
      };
    }[]
  ): ValidationSummary {
    const allFailures: ValidationFailure[] = [];
    const sourceNames: Set<string> = new Set<string>();

    for (const summary of validationSummaries) {
      allFailures.push(...summary.failures);
      sourceNames.add(summary.metadata.source);
    }

    const finalFailures = this.aggregateFailures(allFailures);
    const totalFailures = finalFailures.length;

    let overallStatus: "SUCCESS" | "WARNING" | "FAILURE" = "SUCCESS";
    if (totalFailures === 0) {
      overallStatus = "SUCCESS";
    } else if (finalFailures.some((f) => f.severity === "error")) {
      overallStatus = "FAILURE";
    } else {
      overallStatus = "WARNING";
    }

    return {
      overallStatus,
      totalFailures,
      failures: finalFailures,
      metadata: {
        sources: Array.from(sourceNames),
        aggregationTimestamp: Date.now(),
      },
    };
  }
}