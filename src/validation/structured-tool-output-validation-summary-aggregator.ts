import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ValidationResult {
  validatorName: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface AggregatedError {
  message: string;
  validatorName: string;
}

export interface ValidationSummary {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  failureCountsByType: Record<string, number>;
  aggregatedErrors: AggregatedError[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private results: ValidationResult[];

  constructor(results: ValidationResult[]) {
    this.results = results;
  }

  public aggregate(): ValidationSummary {
    const totalValidations = this.results.length;
    let successfulValidations = 0;
    const failureCountsByType: Record<string, number> = {};
    const aggregatedErrors: AggregatedError[] = [];

    for (const result of this.results) {
      if (result.isValid) {
        successfulValidations++;
      } else {
        failureCountsByType[result.validatorName] =
          (failureCountsByType[result.validatorName] || 0) + 1;
        if (result.errorMessage) {
          aggregatedErrors.push({
            message: result.errorMessage,
            validatorName: result.validatorName,
          });
        }
      }
    }

    return {
      totalValidations,
      successfulValidations,
      failedValidations: totalValidations - successfulValidations,
      failureCountsByType,
      aggregatedErrors,
    };
  }

  public getSummaryReport(): string {
    const summary = this.aggregate();
    let report = "--- Structured Tool Output Validation Summary ---\n";
    report += `Total Validations Run: ${summary.totalValidations}\n`;
    report += `Successful Validations: ${summary.successfulValidations}\n`;
    report += `Failed Validations: ${summary.failedValidations}\n\n`;

    report += "Failure Counts By Validator:\n";
    for (const [validator, count] of Object.entries(summary.failureCountsByType)) {
      report += `  - ${validator}: ${count} failure(s)\n`;
    }

    if (summary.aggregatedErrors.length > 0) {
      report += "\n--- Detailed Error Report ---\n";
      const uniqueErrors = new Map<string, string>();
      for (const error of summary.aggregatedErrors) {
        const key = `${error.validatorName}:${error.message}`;
        if (!uniqueErrors.has(key)) {
          uniqueErrors.set(key, error.message);
        }
      }
      
      let errorCount = 0;
      for (const [key, message] of uniqueErrors.entries()) {
        report += `[Error from ${key.split(':')[0]}]: ${message}\n`;
        errorCount++;
      }
      report += `\nTotal Unique Errors Reported: ${errorCount}\n`;
    } else {
      report += "\nNo validation errors found. All checks passed successfully.\n";
    }

    report += "--------------------------------------------------";
    return report;
  }
}