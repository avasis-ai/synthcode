import { Message, ToolResultMessage } from "./types";

export interface ValidationResult {
  sourceId: string;
  isValid: boolean;
  errors: string[];
  metadata: Record<string, any>;
}

export type AggregationStrategy = "fail-fast" | "collect-all" | "weighted-average";

export interface AggregatedSummary {
  overallSuccess: boolean;
  totalSources: number;
  failedSources: number;
  summaryReport: string;
  weightedConflictScore: number;
  details: ValidationResult[];
}

export class StructuredToolOutputValidationSummaryAggregator {
  private readonly strategy: AggregationStrategy;

  constructor(strategy: AggregationStrategy = "collect-all") {
    this.strategy = strategy;
  }

  public aggregate(results: ValidationResult[]): AggregatedSummary {
    if (!results || results.length === 0) {
      return {
        overallSuccess: true,
        totalSources: 0,
        failedSources: 0,
        summaryReport: "No validation results provided.",
        weightedConflictScore: 0,
        details: [],
      };
    }

    const failedSources = results.filter(r => !r.isValid);
    const overallSuccess = failedSources.length === 0;
    const totalSources = results.length;

    let weightedConflictScore = 0;
    let summaryReport = "";

    if (this.strategy === "fail-fast") {
      if (!overallSuccess) {
        const firstFailure = failedSources[0];
        summaryReport = `Validation failed immediately. Source ${firstFailure.sourceId} failed with errors: ${firstFailure.errors.join(", ")}.`;
        weightedConflictScore = 1.0;
      } else {
        summaryReport = "All validation checks passed successfully.";
        weightedConflictScore = 0.0;
      }
    } else if (this.strategy === "collect-all") {
      const failureDetails = failedSources.map(r => `Source ${r.sourceId} failed: ${r.errors.join(", ")}`).join(" | ");
      summaryReport = `Collected all results. ${failedSources.length} source(s) failed. Details: ${failureDetails || "None."}`;
      weightedConflictScore = failedSources.length * 0.5;
    } else if (this.strategy === "weighted-average") {
      const totalWeight = results.reduce((acc, r) => acc + (r.isValid ? 1.0 : 0.5), 0);
      const failureWeight = failedSources.length * 0.5;
      weightedConflictScore = (totalSources - failedSources.length) * 1.0 + failureWeight;
      summaryReport = `Weighted average summary. ${totalSources} sources processed. Conflict score based on weighted failure assessment.`;
    }

    return {
      overallSuccess: overallSuccess,
      totalSources: totalSources,
      failedSources: failedSources.length,
      summaryReport: summaryReport,
      weightedConflictScore: parseFloat(weightedConflictScore.toFixed(2)),
      details: results,
    };
  }
}

export const createAggregator = (strategy: AggregationStrategy = "collect-all"): StructuredToolOutputValidationSummaryAggregator => {
  return new StructuredToolOutputValidationSummaryAggregator(strategy);
};