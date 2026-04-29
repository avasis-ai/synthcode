import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationSummaryEntry {
  type: string;
  count: number;
  examples: string[];
}

export interface ValidationSummary {
  totalResultsProcessed: number;
  overallSuccess: boolean;
  failureBreakdown: Record<string, ValidationSummaryEntry>;
  summaryReport: string;
  hasHighRateOfMissingFields: boolean;
  hasTypeMismatchIssues: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    type: string;
    message: string;
  }[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private results: ValidationResult[];

  constructor(results: ValidationResult[]) {
    this.results = results;
  }

  private aggregateErrorTypes(results: ValidationResult[]): Record<string, { count: number; examples: string[] }> {
    const breakdown: Record<string, { count: number; examples: string[] }> = {};

    for (const result of results) {
      for (const error of result.errors) {
        const type = error.type;
        if (!breakdown[type]) {
          breakdown[type] = { count: 0, examples: [] };
        }
        breakdown[type].count += 1;
        if (!breakdown[type].examples.includes(error.message)) {
          breakdown[type].examples.push(error.message);
        }
      }
    }
    return breakdown;
  }

  private generateSummaryReport(breakdown: Record<string, { count: number; examples: string[] }>): string {
    let report = "Validation Summary Report:\n";
    let totalFailures = 0;

    for (const [type, data] of Object.entries(breakdown)) {
      report += `\n--- ${type} ---\n`;
      report += `Total Occurrences: ${data.count}\n`;
      report += `Example Errors: ${data.examples.slice(0, 3).join('; ')}\n`;
      totalFailures += data.count;
    }

    if (totalFailures === 0) {
      report += "\nNo specific validation errors were found across all results.";
    }

    return report;
  }

  public generateSummary(): ValidationSummary {
    const totalResultsProcessed = this.results.length;
    const overallSuccess = this.results.every(r => r.isValid);
    const errorBreakdown = this.aggregateErrorTypes(this.results);

    const failureBreakdown: Record<string, ValidationSummaryEntry> = {};
    let missingFieldCount = 0;
    let typeMismatchCount = 0;

    for (const [type, data] of Object.entries(errorBreakdown)) {
      failureBreakdown[type] = {
        type: type,
        count: data.count,
        examples: data.examples,
      };

      if (type === "MissingRequiredField") {
        missingFieldCount += data.count;
      }
      if (type === "TypeMismatch") {
        typeMismatchCount += data.count;
      }
    }

    const hasHighRateOfMissingFields = missingFieldCount > 0;
    const hasTypeMismatchIssues = typeMismatchCount > 0;

    const summaryReport = this.generateSummaryReport(errorBreakdown);

    return {
      totalResultsProcessed,
      overallSuccess,
      failureBreakdown,
      summaryReport,
      hasHighRateOfMissingFields,
      hasTypeMismatchIssues,
    };
  }
}