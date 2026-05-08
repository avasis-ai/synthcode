import { describe, it, expect } from "vitest";
import { SourceMetadata, StalenessPolicy, DecayFunction, FreshnessScore } from "../src/freshness/data-freshness-gate";

const defaultPolicy: StalenessPolicy = {
  maxAgeHours: 24,
  decayFunction: (ageHours: number, maxAgeHours: number) => {
    return Math.max(0, 1 - (ageHours / maxAgeHours));
  },
  minAcceptableScore: 0.5,
};

const calculateFreshnessScore = (metadata: SourceMetadata, policy: StalenessPolicy): FreshnessScore => {
  const ageHours = (Date.now() - metadata.lastUpdatedTimestamp) / (1000 * 60 * 60);
  const decayScore = policy.decayFunction(ageHours, policy.maxAgeHours);
  const volumeScore = Math.min(1, metadata.dataVolumeBytes / 1000000); // Max volume score of 1
  const score = (decayScore * 0.6) + (volumeScore * 0.4);
  return { score: score, isFresh: score >= policy.minAcceptableScore };
};

describe("calculateFreshnessScore", () => {
  it("should return a high score for recently updated data", () => {
    const metadata: SourceMetadata = {
      sourceName: "testSource",
      lastUpdatedTimestamp: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
      dataVolumeBytes: 5000000,
    };
    const score = calculateFreshnessScore(metadata, defaultPolicy);
    expect(score.score).toBeGreaterThan(0.7);
    expect(score.isFresh).toBe(true);
  });

  it("should return a low score for very old data", () => {
    const metadata: SourceMetadata = {
      sourceName: "testSource",
      lastUpdatedTimestamp: Date.now() - (100 * 60 * 60 * 1000), // 100 hours ago
      dataVolumeBytes: 1000,
    };
    const score = calculateFreshnessScore(metadata, defaultPolicy);
    expect(score.score).toBeLessThan(0.2);
    expect(score.isFresh).toBe(false);
  });

  it("should adjust score based on volume and age according to policy", () => {
    const metadata: SourceMetadata = {
      sourceName: "testSource",
      lastUpdatedTimestamp: Date.now() - (12 * 60 * 60 * 1000), // 12 hours ago
      dataVolumeBytes: 10000000, // 10MB
    };
    const customPolicy: StalenessPolicy = {
      maxAgeHours: 24,
      decayFunction: (ageHours: number, maxAgeHours: number) => {
        return Math.max(0, 1 - (ageHours / maxAgeHours));
      },
      minAcceptableScore: 0.6,
    };
    const score = calculateFreshnessScore(metadata, customPolicy);
    // Expected decay score: 1 - (12/24) = 0.5
    // Expected volume score: min(1, 10000000 / 1000000) = 1
    // Expected total score: (0.5 * 0.6) + (1 * 0.4) = 0.3 + 0.4 = 0.7
    expect(score.score).toBeCloseTo(0.7, 2);
    expect(score.isFresh).toBe(true);
  });
});