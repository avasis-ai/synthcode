import { Message } from "./types";

export interface Opinion {
  sourceId: string;
  recommendation: string;
  confidenceScore: number;
}

export interface ConflictReport {
  conflictsFound: boolean;
  details: string[];
}

export interface ConsensusResult {
  consensus: string;
  justification: string;
}

export type ArbitrationStrategy = (opinions: Opinion[]) => {
  result: ConsensusResult;
  report: ConflictReport;
};

export class ConsensusArbitrator {
  private opinions: Opinion[] = [];

  addOpinion(opinion: Opinion): void {
    this.opinions.push(opinion);
  }

  /**
   * Executes the arbitration process using the provided strategy.
   * @param strategy The strategy to resolve conflicts.
   * @returns The combined ConsensusResult and ConflictReport.
   */
  arbitrate(strategy: ArbitrationStrategy): {
    consensus: ConsensusResult;
    report: ConflictReport;
  } {
    if (this.opinions.length === 0) {
      throw new Error("Cannot arbitrate: No opinions provided.");
    }
    return strategy(this.opinions);
  }

  static weightedAverageStrategy(opinions: Opinion[]): {
    consensus: ConsensusResult;
    report: ConflictReport;
  } {
    const totalConfidence = opinions.reduce((sum, op) => sum + op.confidenceScore, 0);
    let weightedSum = 0;
    const weightedOpinions: {
      opinion: Opinion;
      weight: number;
    }[] = [];

    for (const op of opinions) {
      const weight = op.confidenceScore;
      weightedSum += op.recommendation.length * weight;
      weightedOpinions.push({ opinion: op, weight });
    }

    const averageLength = weightedSum / totalConfidence;
    const consensus = `The consensus leans towards a recommendation of average length ${averageLength.toFixed(2)} characters, based on weighted confidence.`;
    const justification = `Weighted average calculated using total confidence (${totalConfidence.toFixed(2)}).`;
    const report: ConflictReport = {
      conflictsFound: false,
      details: [],
    };

    return {
      consensus: { consensus, justification },
      report,
    };
  }

  static majorityVoteStrategy(opinions: Opinion[]): {
    consensus: ConsensusResult;
    report: ConflictReport;
  } {
    const counts: Record<string, number> = {};
    const conflictDetails: string[] = [];

    for (const op of opinions) {
      const recommendation = op.recommendation.toLowerCase().trim();
      counts[recommendation] = (counts[recommendation] || 0) + 1;
    }

    let winningRecommendation: string | null = null;
    let maxVotes = 0;

    for (const [recommendation, count] of Object.entries(counts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningRecommendation = recommendation;
      }
    }

    const consensus = winningRecommendation
      ? `The consensus reached by majority vote is: "${winningRecommendation}".`
      : "No clear consensus could be determined.";

    const justification = `The recommendation "${winningRecommendation || 'N/A'}" received ${maxVotes} votes.`;

    const report: ConflictReport = {
      conflictsFound: maxVotes < opinions.length && opinions.length > 1,
      details: Object.entries(counts).map(([rec, count]) =>
        `Recommendation "${rec}" received ${count} votes.`
      ),
    };

    return {
      consensus: { consensus, justification },
      report,
    };
  }
}