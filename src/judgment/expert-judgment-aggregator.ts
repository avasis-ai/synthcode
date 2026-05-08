import { TextBlock } from "./types";

export interface JudgmentInput {
  sourceId: string;
  rawScore: number;
  confidenceWeight: number;
  rationale: string;
}

export interface JudgmentResult {
  synthesizedScore: number;
  confidenceScore: number;
  report: string;
}

export class ExpertJudgmentAggregator {
  private readonly inputs: JudgmentInput[];

  constructor(inputs: JudgmentInput[]) {
    if (!inputs || inputs.length === 0) {
      throw new Error("Judgment inputs cannot be empty.");
    }
    this.inputs = inputs;
  }

  private calculateWeightedAverage(inputs: JudgmentInput[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const input of inputs) {
      weightedSum += input.rawScore * input.confidenceWeight;
      totalWeight += input.confidenceWeight;
    }

    if (totalWeight === 0) {
      return 0;
    }
    return weightedSum / totalWeight;
  }

  private calculateVariance(scores: number[]): number {
    const count = scores.length;
    if (count < 2) {
      return 0;
    }

    const mean = scores.reduce((acc, score) => acc + score, 0) / count;
    const squaredDifferences = scores.map(score => Math.pow(score - mean, 2));
    const variance = squaredDifferences.reduce((acc, diff) => acc + diff, 0) / (count - 1);
    return variance;
  }

  private generateReport(average: number, variance: number): string {
    let report = "Consensus Report:\n";
    report += `The synthesized judgment score is ${average.toFixed(2)}.`;

    if (variance > 0.5) {
      report += " Note: Significant divergence detected among expert opinions, suggesting high conflict or ambiguity in the input data.";
    } else if (variance > 0.1) {
      report += " Note: Moderate divergence detected. While a consensus score is provided, caution is advised.";
    } else {
      report += " Note: High level of agreement among experts, leading to a robust consensus.";
    }
    return report;
  }

  public aggregate(): JudgmentResult {
    const rawScores = this.inputs.map(input => input.rawScore);
    
    const synthesizedScore = this.calculateWeightedAverage(this.inputs);
    const variance = this.calculateVariance(rawScores);

    // Confidence is inversely related to variance. We normalize it (e.g., 1 / (1 + variance)).
    // We cap the confidence score to ensure it remains positive and meaningful.
    const confidenceScore = Math.max(0.5, 1 / (1 + variance));

    const report = this.generateReport(synthesizedScore, variance);

    return {
      synthesizedScore: parseFloat(synthesizedScore.toFixed(4)),
      confidenceScore: parseFloat(confidenceScore.toFixed(4)),
      report: report,
    };
  }
}