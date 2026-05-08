import { describe, it, expect } from "vitest";
import { TrustworthinessValidator } from "../src/validation/trustworthiness-validator";

describe("TrustworthinessValidator", () => {
  it("should correctly calculate overall trust score when all sources are highly trustworthy", () => {
    const validator = new TrustworthinessValidator(0.7);
    const sources = [
      { sourceId: "A", authorityScore: 0.9, timestamp: Date.now(), contentSnippet: "Good content" },
      { sourceId: "B", authorityScore: 0.8, timestamp: Date.now(), contentSnippet: "More good content" },
    ];
    const report = validator.validate(sources);
    expect(report.isTrusted).toBe(true);
    expect(report.overallScore).toBeGreaterThan(0.7);
    expect(report.violations.length).toBe(0);
  });

  it("should flag sources with low authority score and report violations", () => {
    const validator = new TrustworthinessValidator(0.6);
    const sources = [
      { sourceId: "A", authorityScore: 0.9, timestamp: Date.now(), contentSnippet: "Good content" },
      { sourceId: "B", authorityScore: 0.2, timestamp: Date.now(), contentSnippet: "Suspicious content" },
    ];
    const report = validator.validate(sources);
    expect(report.isTrusted).toBe(false);
    expect(report.violations.length).toBeGreaterThan(0);
    expect(report.flaggedSources).toHaveLength(1);
    expect(report.flaggedSources[0].sourceId).toBe("B");
    expect(report.flaggedSources[0].severity).toBe("high");
  });

  it("should handle an empty list of sources gracefully", () => {
    const validator = new TrustworthinessValidator(0.5);
    const sources: any[] = [];
    const report = validator.validate(sources);
    expect(report.isTrusted).toBe(true);
    expect(report.overallScore).toBe(1.0);
    expect(report.violations).toEqual([]);
    expect(report.flaggedSources).toEqual([]);
  });
});