import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ValidationError {
  toolName: string;
  fieldPath: string;
  errorCode: string;
  message: string;
}

export interface ValidationSummary {
  totalValidationsRun: number;
  totalFailures: number;
  successRatePercentage: number;
  errorCounts: Record<string, number>;
  mostFrequentErrorCodes: string[];
  detailedFailures: ValidationError[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private validationResults: {
    summary: ValidationSummary;
    errors: ValidationError[];
  }[];

  constructor() {
    this.validationResults = [];
  }

  addValidationResult(
    summary: ValidationSummary,
    errors: ValidationError[]
  ): void {
    this.validationResults.push({ summary, errors });
  }

  aggregate(): ValidationSummary {
    let totalValidationsRun = 0;
    let totalFailures = 0;
    const allErrors: ValidationError[] = [];
    const errorFrequency: Record<string, number> = {};

    for (const { summary, errors } of this.validationResults) {
      totalValidationsRun += summary.totalValidationsRun;
      totalFailures += summary.totalFailures;
      allErrors.push(...errors);

      for (const error of errors) {
        const code = error.errorCode;
        errorFrequency[code] = (errorFrequency[code] || 0) + 1;
      }
    }

    const successRatePercentage =
      totalValidationsRun > 0 ? (1 - (totalFailures / totalValidationsRun)) * 100 : 100;

    const mostFrequentErrorCodes = this.getMostFrequent(
      errorFrequency,
      3
    );

    return {
      totalValidationsRun,
      totalFailures,
      successRatePercentage: parseFloat(successRatePercentage.toFixed(2)),
      errorCounts: errorFrequency,
      mostFrequentErrorCodes,
      detailedFailures: allErrors,
    };
  }

  private getMostFrequent(
    counts: Record<string, number>,
    limit: number
  ): string[] {
    const sortedErrors = Object.entries(counts).sort(
      ([_, count], index: number, array: [string, number]) =>
        array[index][1] - (array[index] ? array[index][1] : 0)
    );

    return sortedErrors.slice(0, limit).map(([code]) => code);
  }
}