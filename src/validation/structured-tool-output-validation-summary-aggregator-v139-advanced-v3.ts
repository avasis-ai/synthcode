import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ValidationFailure {
  sourceId: string;
  stage: string;
  failureReason: string;
  severityWeight: number;
  contextLineage: string[];
}

export interface AdvancedValidationSummaryEntry {
  failure: ValidationFailure;
  isCritical: boolean;
}

export interface ValidationSummaryReport {
  totalFailures: number;
  weightedFailureScore: number;
  rootCauseClusters: Record<string, number>;
  actionableSummary: string;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private entries: AdvancedValidationSummaryEntry[] = [];

  constructor() {}

  public addSummaryEntry(entry: AdvancedValidationSummaryEntry): void {
    this.entries.push(entry);
  }

  private calculateWeightedScore(entries: AdvancedValidationSummaryEntry[]): number {
    return entries.reduce((total, entry) => {
      return total + entry.failure.severityWeight;
    }, 0);
  }

  private identifyRootCauseClusters(entries: AdvancedValidationSummaryEntry[]): Record<string, number> {
    const clusters: Record<string, number> = {};
    for (const entry of entries) {
      const clusterKey = entry.failure.sourceId.substring(0, 10) + entry.failure.stage.substring(0, 5);
      clusters[clusterKey] = (clusters[clusterKey] || 0) + 1;
    }
    return clusters;
  }

  public generateReport(): ValidationSummaryReport {
    const totalFailures = this.entries.length;
    const weightedFailureScore = this.calculateWeightedScore(this.entries);
    const rootCauseClusters = this.identifyRootCauseClusters(this.entries);

    const actionableSummary = this.generateActionableSummary(
      totalFailures,
      weightedFailureScore,
      rootCauseClusters
    );

    return {
      totalFailures,
      weightedFailureScore,
      rootCauseClusters,
      actionableSummary,
    };
  }

  private generateActionableSummary(
    total: number,
    score: number,
    clusters: Record<string, number>
  ): string {
    if (total === 0) {
      return "Validation passed successfully. No issues detected.";
    }

    const criticalCount = this.entries.filter(
      (e) => e.failure.severityWeight >= 0.8
    ).length;

    let summary = `Validation Summary: ${total} total failures detected. `;
    summary += `Weighted Score: ${score.toFixed(2)}. `;

    if (criticalCount > 0) {
      summary += `WARNING: ${criticalCount} critical failures require immediate attention. `;
    }

    const topCluster = Object.entries(clusters).reduce(
      (acc, [key, count]) => (count > acc[1] ? [key, count] : acc),
      ["", 0]
    );

    if (topCluster[1] > 1) {
      summary += `Root cause analysis suggests clustering around '${topCluster[0]}' (${topCluster[1]} instances). `;
    } else {
      summary += "Failures appear distributed across multiple sources. ";
    }

    return summary.trim();
  }
}