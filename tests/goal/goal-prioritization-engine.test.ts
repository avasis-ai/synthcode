import { describe, it, expect } from "vitest";
import { GoalPrioritizationEngine, GoalWeights, Goal } from "../src/goal/goal-prioritization-engine";

describe("GoalPrioritizationEngine", () => {
  it("should calculate a higher score for goals with high urgency and impact", () => {
    const weights: GoalWeights = {
      urgencyWeight: 0.5,
      impactWeight: 0.5,
      costWeight: 0.1,
    };
    const engine = new GoalPrioritizationEngine(weights);

    // Goal 1: High Urgency (10), High Impact (10), Low Cost (1)
    const goal1: Goal = { id: "G1", name: "Critical Fix", urgency: 10, impact: 10, cost: 1 };
    // Expected Score: (10 * 0.5) + (10 * 0.5) + (1 * 0.1) = 5 + 5 + 0.1 = 10.1
    const score1 = engine["calculateScore"](goal1);
    expect(score1).toBeCloseTo(10.1);

    // Goal 2: Low Urgency (1), Low Impact (1), High Cost (10)
    const goal2: Goal = { id: "G2", name: "Minor Improvement", urgency: 1, impact: 1, cost: 10 };
    // Expected Score: (1 * 0.5) + (1 * 0.5) + (10 * 0.1) = 0.5 + 0.5 + 1 = 2.0
    const score2 = engine["calculateScore"](goal2);
    expect(score2).toBeCloseTo(2.0);
  });

  it("should correctly prioritize goals based on provided weights", () => {
    const weights: GoalWeights = {
      urgencyWeight: 0.2,
      impactWeight: 0.7,
      costWeight: 0.1,
    };
    const engine = new GoalPrioritizationEngine(weights);

    // Goal A: Medium Urgency (5), High Impact (8), Medium Cost (5)
    const goalA: Goal = { id: "GA", name: "Feature X", urgency: 5, impact: 8, cost: 5 };
    // Score A: (5 * 0.2) + (8 * 0.7) + (5 * 0.1) = 1 + 5.6 + 0.5 = 7.1

    // Goal B: High Urgency (9), Low Impact (2), Low Cost (1)
    const goalB: Goal = { id: "GB", name: "Quick Win", urgency: 9, impact: 2, cost: 1 };
    // Score B: (9 * 0.2) + (2 * 0.7) + (1 * 0.1) = 1.8 + 1.4 + 0.1 = 3.3

    // Goal C: Low Urgency (1), Low Impact (1), Low Cost (1)
    const goalC: Goal = { id: "GC", name: "Maintenance", urgency: 1, impact: 1, cost: 1 };
    // Score C: (1 * 0.2) + (1 * 0.7) + (1 * 0.1) = 0.2 + 0.7 + 0.1 = 1.0

    const scores = [
      { goal: goalA, score: engine["calculateScore"](goalA) },
      { goal: goalB, score: engine["calculateScore"](goalB) },
      { goal: goalC, score: engine["calculateScore"](goalC) },
    ];

    // Check if the scores are calculated correctly
    expect(scores[0].score).toBeCloseTo(7.1);
    expect(scores[1].score).toBeCloseTo(3.3);
    expect(scores[2].score).toBeCloseTo(1.0);

    // Check if the prioritization order is correct (A > B > C)
    expect(scores[0].score).toBeGreaterThan(scores[1].score);
    expect(scores[1].score).toBeGreaterThan(scores[2].score);
  });
});