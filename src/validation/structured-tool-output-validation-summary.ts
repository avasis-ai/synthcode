import { Message } from "./message";

export interface ValidationResult {
  validatorName: string;
  isValid: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface SummaryReport {
  totalResults: number;
  successfulValidations: number;
  failedValidations: number;
  failuresByType: Record<string, number>;
  topErrors: { error: string; count: number }[];
}

export class StructuredToolOutputValidationSummary {
  private results: ValidationResult[];

  constructor(results: ValidationResult[]) {
    this.results = results;
  }

  private calculateSummary(): SummaryReport {
    const totalResults = this.results.length;
    let successfulValidations = 0;
    let failedValidations = 0;
    const failuresByType: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};

    for (const result of this.results) {
      if (result.isValid) {
        successfulValidations++;
      } else {
        failedValidations++;
        const type = result.validatorName;
        failuresByType[type] = (failuresByType[type] || 0) + 1;

        const errorMessage = result.message || "Unknown validation failure";
        errorCounts[errorMessage] = (errorCounts[errorMessage] || 0) + 1;
      }
    }

    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 errors

    return {
      totalResults,
      successfulValidations,
      failedValidations,
      failuresByType,
      topErrors,
    };
  }

  public generateSummary(): SummaryReport {
    return this.calculateSummary();
  }

  public formatReport(summary: SummaryReport): string {
    let report = "--- Structured Tool Output Validation Summary ---\n";
    report += `Total Validators Run: ${summary.totalResults}\n`;
    report += `Successful: ${summary.successfulValidations}\n`;
    report += `Failed: ${summary.failedValidations}\n\n`;

    report += "--- Failures By Validator Type ---\n";
    if (Object.keys(summary.failuresByType).length === 0) {
      report += "No validation failures recorded.\n";
    } else {
      for (const [type, count] of Object.entries(summary.failuresByType)) {
        report += `  - ${type}: ${count} failure(s)\n`;
      }
    }

    report += "\n--- Top 5 Most Common Errors ---\n";
    if (summary.topErrors.length === 0) {
      report += "No specific errors to report.\n";
    } else {
      summary.topErrors.forEach((item, index) => {
        report += `${index + 1}. "${item.error}" (Count: ${item.count})\n`;
      });
    }
    report += "--------------------------------------------------";
    return report;
  }
}