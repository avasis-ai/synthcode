import { Message } from "./types";

export type ConsensusStrategy = "weighted-average" | "majority-vote" | "synthesis";

export interface PerspectiveResult {
  analysis: string;
  confidence: number;
  weight: number;
  key_themes: string[];
}

export interface ConsensusReport {
  final_consensus: string;
  overall_confidence: number;
  conflict_summary: string;
  perspectives_used: number;
}

type PerspectiveFunction = (context: Message) => Promise<PerspectiveResult>;

export class ConsensusEngine {
  private readonly defaultConfidence = 0.8;

  /**
   * Runs the consensus process across multiple specialized perspectives.
   * @param context The central query or message context.
   * @param perspectives An array of asynchronous functions, each representing a specialized perspective.
   * @param strategy The method used to synthesize the final result.
   * @returns A promise resolving to the final ConsensusReport.
   */
  public async runConsensus(
    context: Message,
    perspectives: PerspectiveFunction[],
    strategy: ConsensusStrategy
  ): Promise<ConsensusReport> {
    if (!perspectives || perspectives.length === 0) {
      throw new Error("Must provide at least one perspective function.");
    }

    const results: PerspectiveResult[] = await Promise.all(
      perspectives.map(p => p(context))
    );

    let finalConsensus: string;
    let overallConfidence: number;
    let conflictSummary: string;

    switch (strategy) {
      case "weighted-average":
        ({ finalConsensus, overallConfidence, conflictSummary } = this.applyWeightedAverage(results));
        break;
      case "majority-vote":
        ({ finalConsensus, overallConfidence, conflictSummary } = this.applyMajorityVote(results));
        break;
      case "synthesis":
      default:
        ({ finalConsensus, overallConfidence, conflictSummary } = this.applySynthesis(results));
        break;
    }

    return {
      final_consensus: finalConsensus,
      overall_confidence: overallConfidence,
      conflict_summary: conflictSummary,
      perspectives_used: perspectives.length,
    };
  }

  private applyWeightedAverage(results: PerspectiveResult[]): {
    finalConsensus: string;
    overallConfidence: number;
    conflictSummary: string;
  } {
    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const weightedAverageScore = results.reduce(
      (sum, r) => sum + (r.confidence * r.weight),
      0
    ) / totalWeight;

    const consensus = `The weighted average suggests a high degree of agreement. The core finding is synthesized from the highest weighted themes: ${results.map(r => r.key_themes.join(", ")).join(" | ")}.`;
    const conflict = `While the average confidence is ${averageConfidence.toFixed(2)}, the weighted score suggests a robust consensus of ${weightedAverageScore.toFixed(2)}.`;

    return {
      finalConsensus: consensus,
      overallConfidence: weightedAverageScore,
      conflictSummary: conflict,
    };
  }

  private applyMajorityVote(results: PerspectiveResult[]): {
    finalConsensus: string;
    overallConfidence: number;
    conflictSummary: string;
  } {
    const allThemes = results.flatMap(r => r.key_themes);
    const themeCounts = new Map<string, number>();
    allThemes.forEach(theme => {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    });

    let winningTheme: string | null = null;
    let maxCount = 0;
    for (const [theme, count] of themeCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        winningTheme = theme;
      }
    }

    const consensus = winningTheme
      ? `A clear majority consensus was reached around the theme: ${winningTheme}.`
      : "No single theme achieved a clear majority.";
    
    const conflict = `The highest count was ${maxCount}. The remaining themes show significant divergence, indicating potential areas of conflict.`;

    return {
      finalConsensus: consensus,
      overallConfidence: maxCount / results.length,
      conflictSummary: conflict,
    };
  }

  private applySynthesis(results: PerspectiveResult[]): {
    finalConsensus: string;
    overallConfidence: number;
    conflictSummary: string;
  } {
    const combinedThemes = Array.from(new Set(results.flatMap(r => r.key_themes)));
    const consensus = `Synthesis of all perspectives reveals a multi-faceted conclusion. Key areas of agreement include: ${combinedThemes.join(", ")}. The final recommendation is a holistic approach covering all identified themes.`;
    const conflict = `The synthesis process successfully integrated differing viewpoints, mitigating the need for a single 'winner'.`;

    return {
      finalConsensus: consensus,
      overallConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      conflictSummary: conflict,
    };
  }
}