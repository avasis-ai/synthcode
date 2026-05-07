import { EventEmitter } from "node:events"

export interface EvidencePayload {
  source: string
  claim: string
  timestamp: number
  weight: number
}

export interface ConsensusResult {
  consensusFact: string
  confidenceScore: number
  report: string
}

export class EvidenceConsensusManager {
  private readonly defaultWeight: number = 1.0

  constructor() {}

  private calculateWeightedScore(payloads: EvidencePayload[]): {
    consensusFact: string
    totalWeight: number
    weightedScores: Record<string, number>
  } {
    const weightedScores: Record<string, number> = {}
    let totalWeight = 0

    for (const payload of payloads) {
      const weight = payload.weight > 0 ? payload.weight : this.defaultWeight
      totalWeight += weight
      
      // Simple scoring: count occurrences of key phrases or just sum weights per unique claim
      // For simplicity, we treat the entire claim as the key for now, but we'll refine this
      // to handle partial matches or key concepts if needed.
      // For this implementation, we'll track the weight associated with the claim text itself.
      
      // A more robust approach would involve NLP, but sticking to pure TS logic:
      // We'll use a simplified scoring mechanism based on the claim text.
      const claimKey = payload.claim.toLowerCase().trim()
      weightedScores[claimKey] = (weightedScores[claimKey] || 0) + weight
    }

    return {
      consensusFact: "", // Placeholder, determined later
      totalWeight: totalWeight,
      weightedScores: weightedScores,
    }
  }

  public calculateConsensus(payloads: EvidencePayload[]): ConsensusResult {
    if (!payloads || payloads.length === 0) {
      return {
        consensusFact: "No evidence provided.",
        confidenceScore: 0.0,
        report: "Cannot calculate consensus without any evidence payloads.",
      }
    }

    const { weightedScores, totalWeight } = this.calculateWeightedScore(payloads)

    let bestMatchKey: string | null = null
    let maxScore: number = -1

    // 1. Determine the consensus fact (the claim with the highest aggregated weight)
    for (const key in weightedScores) {
      const score = weightedScores[key];
      if (score > maxScore) {
        maxScore = score;
        bestMatchKey = key;
      }
    }

    const consensusFact = bestMatchKey ? bestMatchKey.replace(/([a-z])([A-Z])/g, "$1 $2") : "Unknown";

    // 2. Calculate Confidence Score (Normalized max score relative to total weight)
    // Confidence = max_score / total_weight
    const confidenceScore = totalWeight > 0 ? Math.min(1.0, maxScore / totalWeight) : 0.0;

    // 3. Generate Report
    let report = "Consensus derived based on weighted evidence analysis. ";
    report += `The most strongly supported claim is: "${consensusFact}". `;
    report += `This claim accumulated a score of ${maxScore.toFixed(2)} out of a total evidence weight of ${totalWeight.toFixed(2)}.`;

    if (payloads.length > 1) {
      report += " Conflicts were resolved by prioritizing the claim with the highest aggregated weight, indicating the strongest combined support.";
    } else {
      report += " Only a single piece of evidence was provided; consensus matches the source claim.";
    }

    return {
      consensusFact: consensusFact,
      confidenceScore: parseFloat(confidenceScore.toFixed(4)),
      report: report,
    }
  }
}

export { EvidenceConsensusManager }