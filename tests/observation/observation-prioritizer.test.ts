import { describe, it, expect } from "vitest";
import { ObservationPrioritizer, SourceMetadata, Observation } from "../src/observation/observation-prioritizer";

describe("ObservationPrioritizer", () => {
  it("should assign a high weight to observations from reliable API sources", () => {
    const source: SourceMetadata = {
      credibilityScore: 0.9,
      sourceType: "API",
      reliabilityTags: ["verified", "realtime"],
    };
    const observation: Observation = {
      source: source,
      content: "API data about the market.",
      timestamp: Date.now(),
    };
    const prioritizer = new ObservationPrioritizer();
    const weight = prioritizer.calculateWeight(observation);
    expect(weight).toBeGreaterThan(0.8);
  });

  it("should assign a low weight to observations from unknown sources", () => {
    const source: SourceMetadata = {
      credibilityScore: 0.1,
      sourceType: "Unknown",
      reliabilityTags: [],
    };
    const observation: Observation = {
      source: source,
      content: "Unverified user input.",
      timestamp: Date.now(),
    };
    const prioritizer = new ObservationPrioritizer();
    const weight = prioritizer.calculateWeight(observation);
    expect(weight).toBeLessThan(0.3);
  });

  it("should handle edge cases with missing or empty source data gracefully", () => {
    // Simulate a scenario where source metadata is minimal
    const source: SourceMetadata = {
      credibilityScore: 0.5,
      sourceType: "User",
      reliabilityTags: [],
    };
    const observation: Observation = {
      source: source,
      content: "General user comment.",
      timestamp: Date.now(),
    };
    const prioritizer = new ObservationPrioritizer();
    const weight = prioritizer.calculateWeight(observation);
    // Expect a moderate weight, indicating basic processing occurred
    expect(weight).toBeGreaterThanOrEqual(0.4);
  });
});