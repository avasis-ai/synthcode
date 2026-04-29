import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ValidationSummary {
  toolId: string;
  isValid: boolean;
  errors: {
    type: string;
    message: string;
    fieldPath: string;
  }[];
  warnings: {
    type: string;
    message: string;
    fieldPath: string;
  }[];
}

export interface AggregatedValidationReport {
  totalToolsValidated: number;
  overallSuccess: boolean;
  errorSummary: Record<string, {
    count: number;
    firstOccurrence: string;
    lastOccurrence: string;
  }>;
  warningSummary: Record<string, {
    count: number;
    firstOccurrence: string;
    lastOccurrence: string;
  }>;
  detailedFailures: {
    toolId: string;
    errors: {
      type: string;
      message: string;
      fieldPath: string;
    }[];
    warnings: {
      type: string;
      message: string;
      fieldPath: string;
    }[];
  }[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private summaries: {
    summary: ValidationSummary;
    toolId: string;
  }[];

  constructor() {
    this.summaries = [];
  }

  addSummary(summary: ValidationSummary, toolId: string): void {
    this.summaries.push({ summary, toolId });
  }

  aggregate(): AggregatedValidationReport {
    const totalToolsValidated = this.summaries.length;
    const overallSuccess = this.summaries.every(
      ({ summary }) => summary.isValid
    );

    const errorSummary: Record<string, {
      count: number;
      firstOccurrence: string;
      lastOccurrence: string;
    }> = {};
    const warningSummary: Record<string, {
      count: number;
      firstOccurrence: string;
      lastOccurrence: string;
    }> = {};
    const detailedFailures: {
      toolId: string;
      errors: {
        type: string;
        message: string;
        fieldPath: string;
      }[];
      warnings: {
        type: string;
        message: string;
        fieldPath: string;
      }[];
    }[] = [];

    this.summaries.forEach(({ summary, toolId }) => {
      detailedFailures.push({
        toolId,
        errors: summary.errors,
        warnings: summary.warnings,
      });

      summary.errors.forEach((error) => {
        if (!errorSummary[error.type]) {
          errorSummary[error.type] = {
            count: 0,
            firstOccurrence: toolId,
            lastOccurrence: toolId,
          };
        }
        errorSummary[error.type]!.count += 1;
        errorSummary[error.type]!.lastOccurrence = toolId;
      });

      summary.warnings.forEach((warning) => {
        if (!warningSummary[warning.type]) {
          warningSummary[warning.type] = {
            count: 0,
            firstOccurrence: toolId,
            lastOccurrence: toolId,
          };
        }
        warningSummary[warning.type]!.count += 1;
        warningSummary[warning.type]!.lastOccurrence = toolId;
      });
    });

    return {
      totalToolsValidated,
      overallSuccess,
      errorSummary,
      warningSummary,
      detailedFailures,
    };
  }
}