import { describe, it, expect } from "vitest";
import { ContextualGoalDriftDetector } from "../src/context/contextual-goal-drift-detector";

describe("ContextualGoalDriftDetector", () => {
  it("should correctly identify no drift when context aligns with the goal", () => {
    const detector = new ContextualGoalDriftDetector(0.5);
    const context = "The user wants to book a flight to London next month.";
    const goal = {
      primaryObjective: "Book a flight",
      subGoals: ["Select destination", "Choose dates"],
      requiredOutcomes: ["Flight confirmation"],
      keywords: new Set(["flight", "London", "book"]),
    };
    const report = detector.detect(context, goal);
    expect(report.isDrifting).toBe(false);
    expect(report.driftScore).toBeLessThan(0.5);
  });

  it("should detect significant drift when context deviates from the goal", () => {
    const detector = new ContextualGoalDriftDetector(0.3);
    const context = "Instead, I need to find a good Italian restaurant near my hotel.";
    const goal = {
      primaryObjective: "Book a flight",
      subGoals: ["Select destination", "Choose dates"],
      requiredOutcomes: ["Flight confirmation"],
      keywords: new Set(["flight", "London", "book"]),
    };
    const report = detector.detect(context, goal);
    expect(report.isDrifting).toBe(true);
    expect(report.driftScore).toBeGreaterThan(0.3);
  });

  it("should handle edge case with a very low drift threshold", () => {
    const detector = new ContextualGoalDriftDetector(0.1);
    const context = "I'm looking for flights to Paris.";
    const goal = {
      primaryObjective: "Book a flight",
      subGoals: ["Select destination", "Choose dates"],
      requiredOutcomes: ["Flight confirmation"],
      keywords: new Set(["flight", "London", "book"]),
    };
    const report = detector.detect(context, goal);
    // Expecting a moderate drift score, but it should still be flagged if the score > 0.1
    expect(report.driftScore).toBeGreaterThanOrEqual(0.1);
  });
});