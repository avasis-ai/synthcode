export type Claim = string;

export interface EvidencePayload {
  claim: Claim;
  sourceAuthorityScore: number;
  recencyScore: number;
  evidenceText: string;
  sourceMetadata: Record<string, any>;
}

export interface ConflictDetail {
  conflictingEvidence: EvidencePayload;
  reasonForConflict: string;
}

export interface ConflictReport {
  conflicts: ConflictDetail[];
  summary: string;
}

export interface ResolvedFact {
  synthesizedTruth: string;
  finalConfidenceScore: number;
  conflictReport: ConflictReport;
}

export class EvidenceTriangulationService {
  /**
   * Calculates a weighted score for a piece of evidence.
   * Score = Authority * Recency * Corroboration (Corroboration is implicitly handled by the count, but we use the input scores).
   * @param evidence The evidence payload.
   * @returns The calculated weighted score.
   */
  private calculateWeightedScore(evidence: EvidencePayload): number {
    // Simple multiplicative weighting model
    return evidence.sourceAuthorityScore * evidence.recencyScore * 1.0;
  }

  /**
   * Groups evidence by the core claim they address.
   * @param evidenceList Array of evidence payloads.
   * @returns A map where keys are claims and values are arrays of evidence payloads.
   */
  private groupEvidenceByClaim(evidenceList: EvidencePayload[]): Map<Claim, EvidencePayload[]> {
    const grouped: Map<Claim, EvidencePayload[]> = new Map();
    for (const evidence of evidenceList) {
      if (!grouped.has(evidence.claim)) {
        grouped.set(evidence.claim, []);
      }
      grouped.get(evidence.claim)!.push(evidence);
    }
    return grouped;
  }

  /**
   * Resolves conflicts for a single claim based on weighted scoring.
   * @param evidenceGroup All evidence related to one claim.
   * @returns An object containing the resolved fact and conflict details.
   */
  private resolveClaim(evidenceGroup: EvidencePayload[]): { resolvedFact: string; score: number; conflicts: ConflictDetail[] } {
    if (evidenceGroup.length === 0) {
      return { resolvedFact: "", score: 0, conflicts: [] };
    }

    // 1. Sort by score to find the most authoritative evidence
    const scoredEvidence = evidenceGroup.map(e => ({
      evidence: e,
      score: this.calculateWeightedScore(e),
    }));

    scoredEvidence.sort((a, b) => b.score - a.score);

    const bestEvidence = scoredEvidence[0].evidence;
    const finalScore = scoredEvidence[0].score;

    // 2. Synthesize the truth (simplified: use the text from the highest scoring evidence)
    const synthesizedTruth = bestEvidence.evidenceText;

    // 3. Identify conflicts
    const conflicts: ConflictDetail[] = [];
    for (let i = 1; i < evidenceGroup.length; i++) {
      const conflictingEvidence = evidenceGroup[i];
      const reason = `Conflict detected: This evidence (Score: ${this.calculateWeightedScore(conflictingEvidence).toFixed(2)}) contradicts the primary finding based on the highest weighted evidence (Score: ${finalScore.toFixed(2)}).`;
      conflicts.push({
        conflictingEvidence: conflictingEvidence,
        reasonForConflict: reason,
      });
    }

    return {
      resolvedFact: synthesizedTruth,
      score: finalScore,
      conflicts: conflicts,
    };
  }

  /**
   * Ingests multiple pieces of evidence, resolves conflicts, and produces a verifiable fact.
   * @param evidenceList Array of evidence payloads.
   * @returns A ResolvedFact object containing the synthesized truth and conflict report.
   */
  public triangulate(evidenceList: EvidencePayload[]): ResolvedFact {
    const groupedEvidence = this.groupEvidenceByClaim(evidenceList);
    const resolvedResults: { resolvedFact: string; score: number; conflicts: ConflictDetail[] }[] = [];

    for (const [claim, evidenceGroup] of groupedEvidence.entries()) {
      const result = this.resolveClaim(evidenceGroup);
      resolvedResults.push({
        resolvedFact: result.resolvedFact,
        score: result.score,
        conflicts: result.conflicts,
      });
    }

    // Aggregate results into the final structure
    const finalTruth = resolvedResults.map(r => r.resolvedFact).join(" | ");
    const maxConfidenceScore = Math.max(...resolvedResults.map(r => r.score));

    const conflictReport: ConflictReport = {
      conflicts: resolvedResults.flatMap(r => r.conflicts),
      summary: `Triangulation completed across ${groupedEvidence.size} distinct claims. The highest confidence score achieved was ${maxConfidenceScore.toFixed(2)}.`,
    };

    return {
      synthesizedTruth: finalTruth,
      finalConfidenceScore: maxConfidenceScore,
      conflictReport: conflictReport,
    };
  }
}

export { EvidenceTriangulationService };