import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationResult {
  isValid: boolean;
  sourceId: string;
  errors: {
    message: string;
    errorCode: string;
  }[];
  metadata: Record<string, unknown>;
}

export interface ValidationSummaryEntry {
  sourceId: string;
  isSuccessful: boolean;
  errorCount: number;
  errorMessages: string[];
  errorCodes: Record<string, number>;
}

export interface ValidationSummary {
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  overallSuccessRate: number;
  summaryEntries: ValidationSummaryEntry[];
  topErrorCategories: {
    code: string;
    count: number;
  }[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private summaryEntries: ValidationSummaryEntry[] = [];

  processValidationResult(result: ValidationResult, sourceId: string): void {
    const existingEntry = this.summaryEntries.find(
      (entry) => entry.sourceId === sourceId
    );

    if (existingEntry) {
      this.mergeResults(existingEntry, result);
    } else {
      this.summaryEntries.push({
        sourceId: sourceId,
        isSuccessful: result.isValid,
        errorCount: result.errors.length,
        errorMessages: [...result.errors.map((e) => e.message)],
        errorCodes: this.buildErrorCounts(result.errors),
      });
    }
  }

  private buildErrorCounts(errors: {
    message: string;
    errorCode: string;
  }[]): Record<string, number> {
    const codes: Record<string, number> = {};
    for (const error of errors) {
      codes[error.errorCode] = (codes[error.errorCode] || 0) + 1;
    }
    return codes;
  }

  private mergeResults(
    existingEntry: ValidationSummaryEntry,
    result: ValidationResult
  ): void {
    existingEntry.isSuccessful = result.isValid;
    existingEntry.errorCount += result.errors.length;
    
    const newMessages = result.errors.map((e) => e.message);
    existingEntry.errorMessages.push(...newMessages);

    const newCodes = this.buildErrorCounts(result.errors);
    for (const code in newCodes) {
      const count = newCodes[code];
      existingEntry.errorCodes[code] = (existingEntry.errorCodes[code] || 0) + count;
    }
  }

  generateReport(): ValidationSummary {
    const totalSources = this.summaryEntries.length;
    let successfulSources = 0;
    let failedSources = 0;

    for (const entry of this.summaryEntries) {
      if (entry.isSuccessful) {
        successfulSources++;
      } else {
        failedSources++;
      }
    }

    const overallSuccessRate = totalSources > 0 ? (successfulSources / totalSources) * 100 : 100;

    const errorCodeCounts: Record<string, number> = {};
    for (const entry of this.summaryEntries) {
      for (const code in entry.errorCodes) {
        const count = entry.errorCodes[code];
        errorCodeCounts[code] = (errorCodeCounts[code] || 0) + count;
      }
    }

    const topErrorCategories = Object.entries(errorCodeCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSources,
      successfulSources,
      failedSources,
      overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
      summaryEntries: [...this.summaryEntries],
      topErrorCategories,
    };
  }
}