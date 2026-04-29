import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ValidationResult {
  sourceId: string;
  isValid: boolean;
  message: string;
  details?: Record<string, any>;
  severity: "ERROR" | "WARNING" | "INFO";
}

export interface AggregatedSummary {
  totalResults: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  failures: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private results: ValidationResult[] = [];

  private addResult(result: ValidationResult): void {
    this.results.push(result);
  }

  public addValidationResult(result: ValidationResult): void {
    if (!result.sourceId || !result.message) {
      throw new Error("Validation result must have sourceId and message.");
    }
    this.addResult(result);
  }

  public mergeResults(newResults: ValidationResult[]): void {
    for (const result of newResults) {
      this.addResult(result);
    }
  }

  public generateSummary(): AggregatedSummary {
    const failures: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    const info: ValidationResult[] = [];

    for (const result of this.results) {
      switch (result.severity) {
        case "ERROR":
          failures.push(result);
          break;
        case "WARNING":
          warnings.push(result);
          break;
        case "INFO":
          info.push(result);
          break;
      }
    }

    return {
      totalResults: this.results.length,
      successCount: this.results.filter(r => r.severity === "INFO" && r.isValid).length,
      errorCount: failures.length,
      warningCount: warnings.length,
      failures: failures,
      warnings: warnings,
      info: info,
    };
  }
}