import { ContextPayload } from "./context-payload";

export interface SourceMetadata {
  sourceId: string;
  authorityScore: number;
  timestamp: number;
  contentSnippet: string;
}

export interface TrustViolationReport {
  overallScore: number;
  isTrusted: boolean;
  violations: string[];
  flaggedSources: {
    sourceId: string;
    reason: string;
    severity: "low" | "medium" | "high";
  }[];
  summary: string;
}

export class TrustworthinessValidator {
  private readonly TRUST_THRESHOLD: number = 0.6;

  constructor() {}

  /**
   * Assesses the overall reliability and trustworthiness of the provided context and sources.
   * @param context The primary context payload.
   * @param sources List of metadata for all sources used.
   * @returns A comprehensive TrustViolationReport.
   */
  validate(context: ContextPayload, sources: SourceMetadata[]): TrustViolationReport {
    let totalScore = 0;
    const violations: string[] = [];
    const flaggedSources: Record<string, { reason: string; severity: "low" | "medium" | "high" }> = {};

    if (!sources || sources.length === 0) {
      return {
        overallScore: 0,
        isTrusted: false,
        violations: ["No sources provided for validation."],
        flaggedSources: [],
        summary: "Cannot assess trustworthiness without sources.",
      };
    }

    // 1. Calculate base score (Authority + Recency)
    let authoritySum = 0;
    let recencySum = 0;

    for (const source of sources) {
      authoritySum += source.authorityScore;
      // Simple recency score: closer to now is better (normalized)
      const ageDays = Math.floor((Date.now() - source.timestamp) / (1000 * 60 * 60 * 24));
      const recencyScore = Math.max(0, 1 - (ageDays / 365)); // Max score 1, decays over years
      recencySum += recencyScore;
    }

    const averageAuthority = authoritySum / sources.length;
    const averageRecency = recencySum / sources.length;

    // Base score calculation (weighted average)
    totalScore = (averageAuthority * 0.4) + (averageRecency * 0.3) + (0.3); // Added 0.3 base for minimum confidence

    // 2. Conflict Resolution Penalty
    let conflictPenalty = 0;
    const highAuthoritySources = sources.filter(s => s.authorityScore > 0.8);

    if (highAuthoritySources.length > 0) {
      for (let i = 0; i < sources.length; i++) {
        const currentSource = sources[i];
        let contradictsHighAuthority = false;

        for (const highSource of highAuthoritySources) {
          // Simple conflict detection: checking for keyword contradiction (highly simplified)
          const keywords = ["not", "never", "false", "contradicts"];
          const snippetLower = currentSource.contentSnippet.toLowerCase();
          const highSnippetLower = highSource.contentSnippet.toLowerCase();

          if (keywords.some(k => snippetLower.includes(k) && highSnippetLower.includes(k))) {
            contradictsHighAuthority = true;
            break;
          }
        }

        if (contradictsHighAuthority) {
          conflictPenalty += 0.15;
          flaggedSources[currentSource.sourceId] = {
            reason: "Contradicts high-authority sources.",
            severity: "high",
          };
          violations.push(`Conflict detected in source ${currentSource.sourceId}.`);
        }
      }
    }

    // 3. Final Score Adjustment
    totalScore = Math.max(0, totalScore - conflictPenalty);

    // 4. Determine Trust Status and Summary
    const isTrusted = totalScore >= this.TRUST_THRESHOLD;

    if (!isTrusted) {
      violations.push(`Overall trust score (${totalScore.toFixed(2)}) fell below the threshold (${this.TRUST_THRESHOLD}).`);
    }

    const summary = `Trustworthiness assessed. Score: ${totalScore.toFixed(2)}. Sources analyzed: ${sources.length}.`;

    return {
      overallScore: parseFloat(totalScore.toFixed(2)),
      isTrusted: isTrusted,
      violations: violations,
      flaggedSources: Object.keys(flaggedSources).map(id => ({
        sourceId: id,
        ...flaggedSources[id],
      })),
      summary: summary,
    };
  }
}

export { TrustworthinessValidator };