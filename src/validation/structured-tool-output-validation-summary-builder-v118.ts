import {
  ToolResultMessage,
  UserMessage,
  AssistantMessage,
} from "./types";

export interface ValidationError {
  toolName: string;
  stage: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  toolName: string;
  stage: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ErrorFrequency {
  type: string;
  count: number;
}

export interface StructuredSummary {
  totalResults: number;
  successfulResults: number;
  failedResults: number;
  totalErrors: number;
  totalWarnings: number;
  errorBreakdown: ErrorFrequency[];
  warningBreakdown: ErrorFrequency[];
  schemaDriftCount: number;
  summaryDetails: Record<string, any>;
}

export class StructuredToolOutputValidationSummaryBuilder {
  private results: ValidationResult[];

  constructor(results: ValidationResult[]) {
    this.results = results;
  }

  private countOccurrences(items: (keyof ValidationError)[], keyAccessor: (e: ValidationError) => any): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of this.results) {
      for (const key of items) {
        const value = keyAccessor(item.errors.find(e => e[key] && e[key] as any) || item.warnings.find(e => e[key] && e[key] as any));
        if (value) {
          const key = `${value}-${item.toolName}-${item.stage}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    return counts;
  }

  private getErrorFrequency(errors: ValidationError[]): ErrorFrequency[] {
    const frequencyMap: Record<string, number> = {};
    for (const error of errors) {
      const key = `${error.field}:${error.message}`;
      frequencyMap[key] = (frequencyMap[key] || 0) + 1;
    }
    return Object.keys(frequencyMap).map(key => ({
      type: key,
      count: frequencyMap[key]!,
    }));
  }

  private getWarningFrequency(warnings: ValidationError[]): ErrorFrequency[] {
    const frequencyMap: Record<string, number> = {};
    for (const warning of warnings) {
      const key = `${warning.field}:${warning.message}`;
      frequencyMap[key] = (frequencyMap[key] || 0) + 1;
    }
    return Object.keys(frequencyMap).map(key => ({
      type: key,
      count: frequencyMap[key]!,
    }));
  }

  public build(): StructuredSummary {
    let totalErrors = 0;
    let totalWarnings = 0;
    let schemaDriftCount = 0;
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    for (const result of this.results) {
      if (!result.isValid) {
        totalErrors += result.errors.length;
        allErrors.push(...result.errors);
      } else {
        totalErrors += 0;
      }

      totalWarnings += result.warnings.length;
      allWarnings.push(...result.warnings);

      if (result.stage.includes("schema_drift")) {
        schemaDriftCount += 1;
      }
    }

    const errorBreakdown = this.getErrorFrequency(allErrors);
    const warningBreakdown = this.getWarningFrequency(allWarnings);

    return {
      totalResults: this.results.length,
      successfulResults: this.results.filter(r => r.isValid && r.warnings.length === 0).length,
      failedResults: this.results.filter(r => !r.isValid).length,
      totalErrors: totalErrors,
      totalWarnings: totalWarnings,
      errorBreakdown: errorBreakdown,
      warningBreakdown: warningBreakdown,
      schemaDriftCount: schemaDriftCount,
      summaryDetails: {
        averageErrorsPerResult: totalErrors / this.results.length,
        averageWarningsPerResult: totalWarnings / this.results.length,
      },
    };
  }
}