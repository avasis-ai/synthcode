import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface NestedValidationError {
  path: string;
  message: string;
  source?: "tool_call" | "validation_schema";
  details?: Record<string, any>;
  nestedErrors?: NestedValidationError[];
}

export interface ToolValidationSummary {
  tool_name: string;
  tool_call_id: string;
  isValid: boolean;
  errors: NestedValidationError[];
  summary?: string;
}

export interface AdvancedValidationSummary {
  overallSuccess: boolean;
  totalToolsValidated: number;
  toolSummaries: ToolValidationSummary[];
  criticalFailures: NestedValidationError[];
  aggregatedReport: string;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private summaries: ToolValidationSummary[] = [];

  private static mergeErrors(existing: NestedValidationError[], newErrors: NestedValidationError[]): NestedValidationError[] {
    const mergedMap = new Map<string, NestedValidationError>();

    const processErrors = (errors: NestedValidationError[]) => {
      for (const error of errors) {
        const key = `${error.path}:${error.source}`;
        if (mergedMap.has(key)) {
          const existingError = mergedMap.get(key)!;
          if (error.nestedErrors && error.nestedErrors.length > 0) {
            const updatedNested = [...(existingError.nestedErrors || []), ...error.nestedErrors];
            mergedMap.set(key, {
              ...existingError,
              nestedErrors: [...(existingError.nestedErrors || []), ...updatedNested],
            });
          } else {
            // Simple merge or overwrite if necessary, prioritizing detail
            mergedMap.set(key, {
              ...existingError,
              message: error.message || existingError.message,
              details: { ...(existingError.details || {}), ...(error.details || {}) },
            });
          }
        } else {
          mergedMap.set(key, error);
        }
      }
    };

    processErrors(existing);
    processErrors(newErrors);

    return Array.from(mergedMap.values());
  }

  private static aggregateSummaries(summaries: ToolValidationSummary[]): AdvancedValidationSummary {
    const criticalFailures: NestedValidationError[] = [];
    const toolSummaries: ToolValidationSummary[] = [];

    for (const summary of summaries) {
      toolSummaries.push(summary);
      if (!summary.isValid) {
        criticalFailures.push(...summary.errors);
      }
    }

    const overallSuccess = criticalFailures.length === 0;

    const generateReport = (): string => {
      let report = `--- Structured Tool Output Validation Summary ---\n`;
      report += `Overall Status: ${overallSuccess ? "SUCCESS" : "FAILURE"}\n`;
      report += `Total Tools Validated: ${toolSummaries.length}\n`;
      report += `Critical Failures Found: ${criticalFailures.length}\n\n`;

      report += "--- Detailed Tool Breakdown ---\n";
      for (let i = 0; i < toolSummaries.length; i++) {
        const summary = toolSummaries[i];
        report += `[${i + 1}] ${summary.tool_name} (${summary.tool_call_id}): ${summary.isValid ? "✅ Valid" : "❌ Invalid"}\n`;
        if (summary.errors.length > 0) {
          report += `    Errors Found: ${summary.errors.length}\n`;
          summary.errors.slice(0, 3).forEach((err, index) => {
            report += `    - ${index + 1}. Path: ${err.path} [Source: ${err.source || 'Unknown'}]. Message: ${err.message.substring(0, 80)}...\n`;
          });
          if (summary.errors.length > 3) {
            report += `    ... and ${summary.errors.length - 3} more errors.\n`;
          }
        }
      }

      if (criticalFailures.length > 0) {
        report += "\n--- Consolidated Critical Failure Paths ---\n";
        const uniquePaths = new Set<string>();
        criticalFailures.forEach(err => {
          if (!uniquePaths.has(err.path)) {
            report += `Path: ${err.path}\n`;
            report += `  Primary Error: ${err.message}\n`;
            if (err.nestedErrors && err.nestedErrors.length > 0) {
              report += `  Nested Failures (${err.nestedErrors.length}):\n`;
              err.nestedErrors.forEach(nErr => {
                report += `    - ${nErr.path}: ${nErr.message}\n`;
              });
            }
            uniquePaths.add(err.path);
          }
        });
      }

      return report;
    };

    return {
      overallSuccess: overallSuccess,
      totalToolsValidated: toolSummaries.length,
      toolSummaries: toolSummaries,
      criticalFailures: criticalFailures,
      aggregatedReport: generateReport(),
    };
  }

  constructor() {}

  /**
   * Processes and aggregates multiple tool validation summaries into one advanced report.
   * @param summaries An array of individual tool validation summaries.
   * @returns A comprehensive AdvancedValidationSummary object.
   */
  public aggregate(summaries: ToolValidationSummary[]): AdvancedValidationSummary {
    if (!summaries || summaries.length === 0) {
      return {
        overallSuccess: true,
        totalToolsValidated: 0,
        toolSummaries: [],
        criticalFailures: [],
        aggregatedReport: "No validation summaries provided.",
      };
    }

    // In this advanced version, we assume the input 'summaries' array is already the result
    // of individual validation passes, so we focus on merging and reporting.
    return StructuredToolOutputValidationSummaryAggregator.aggregateSummaries(summaries);
  }
}