import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationFailure {
  path: string;
  description: string;
  severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  context: string;
}

export interface ValidationSummaryEntry {
  failures: ValidationFailure[];
  severityWeight: number;
  contextRelevanceScore: number;
}

export interface ValidationSummary {
  totalFailures: number;
  criticalFailures: number;
  summaryByPath: Record<string, {
    failures: ValidationFailure[];
    weightedScore: number;
    isConflict: boolean;
  }>;
  manualReviewRequired: boolean;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private entries: ValidationSummaryEntry[];

  constructor() {
    this.entries = [];
  }

  private calculateSeverityWeight(severity: ValidationFailure["severity"]): number {
    switch (severity) {
      case "CRITICAL":
        return 5;
      case "ERROR":
        return 3;
      case "WARNING":
        return 2;
      case "INFO":
        return 1;
      default:
        return 0;
    }
  }

  private calculateCombinedScore(entry: ValidationSummaryEntry): number {
    return entry.severityWeight * entry.contextRelevanceScore;
  }

  public addEntry(
    failures: ValidationFailure[],
    severityWeight: number,
    contextRelevanceScore: number
  ): void {
    this.entries.push({
      failures,
      severityWeight,
      contextRelevanceScore,
    });
  }

  public merge(
    existingEntries: ValidationSummaryEntry[],
    newFailures: ValidationFailure[],
    newSeverityWeight: number,
    newContextRelevanceScore: number
  ): ValidationSummaryEntry {
    const combinedFailures = [...existingEntries.flatMap(e => e.failures), ...newFailures];
    const maxWeight = Math.max(
      existingEntries.reduce((max, e) => Math.max(max, e.severityWeight), 0),
      newSeverityWeight
    );
    const maxContext = Math.max(
      existingEntries.reduce((max, e) => Math.max(max, e.contextRelevanceScore), 0),
      newContextRelevanceScore
    );

    return {
      failures: combinedFailures,
      severityWeight: Math.max(maxWeight, newSeverityWeight),
      contextRelevanceScore: Math.max(maxContext, newContextRelevanceScore),
    };
  }

  public generateFinalReport(): ValidationSummary {
    if (this.entries.length === 0) {
      return {
        totalFailures: 0,
        criticalFailures: 0,
        summaryByPath: {},
        manualReviewRequired: false,
      };
    }

    const aggregatedFailures: Record<string, ValidationFailure[]> = {};
    const pathScores: Record<string, {
      failures: ValidationFailure[];
      weightedScore: number;
      isConflict: boolean;
    }> = {};

    for (const entry of this.entries) {
      for (const failure of entry.failures) {
        const path = failure.path;
        if (!aggregatedFailures[path]) {
          aggregatedFailures[path] = [];
        }
        aggregatedFailures[path].push(failure);
      }
    }

    for (const path in aggregatedFailures) {
      const failures = aggregatedFailures[path];
      let totalWeight = 0;
      let maxContext = 0;
      let hasConflict = false;

      // Simple conflict detection: if multiple distinct entries report on the same path
      // with different severity levels, we flag it.
      const uniqueSeverities = new Set(failures.map(f => f.severity));
      if (uniqueSeverities.size > 1) {
        hasConflict = true;
      }

      // For simplicity in this aggregation, we'll use the highest observed weight/context
      // across all entries that contributed to this path.
      // In a real scenario, we'd need to track source entry weights per path.
      // Here, we approximate by using the max score of the current entry's context.
      const representativeEntry = this.entries.find(e => e.failures.some(f => f.path === path));
      const score = representativeEntry ? this.calculateCombinedScore(representativeEntry) : 0;

      pathScores[path] = {
        failures: failures,
        weightedScore: score,
        isConflict: hasConflict,
      };
    }

    const totalFailures = this.entries.reduce(
      (acc, entry) => acc + entry.failures.length,
      0
    );

    const criticalFailures = this.entries.reduce(
      (acc, entry) => acc + entry.failures.filter(f => f.severity === "CRITICAL").length,
      0
    );

    const manualReviewRequired = Object.values(pathScores).some(
      (item) => item.isConflict || item.weightedScore > 15
    );

    return {
      totalFailures,
      criticalFailures,
      summaryByPath: pathScores,
      manualReviewRequired,
    };
  }
}