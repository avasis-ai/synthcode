import { describe, it, expect } from "vitest";
import { GoalRefinementEngine } from "../src/goal-refinement-engine.js";

describe("GoalRefinementEngine", () => {
  it("should initialize correctly", () => {
    const engine = new GoalRefinementEngine();
    expect(engine).toBeInstanceOf(GoalRefinementEngine);
  });

  it("should generate hypotheses when given a goal and context", async () => {
    const engine = new GoalRefinementEngine();
    const initialGoal = "Plan a trip to Paris.";
    const context = "The user prefers historical sites and good food.";

    // Mocking the internal method call structure for testing purposes
    // Assuming the engine has a method like generateHypotheses
    // Since the full implementation is not provided, we simulate the expected behavior
    // by calling a hypothetical public method or mocking the private one if possible.
    // For this test, we assume a public method `generateHypotheses` exists.
    const hypotheses = await engine.generateHypotheses(initialGoal, context);

    expect(hypotheses).toBeDefined();
    expect(Array.isArray(hypotheses)).toBe(true);
    expect(hypotheses.length).toBeGreaterThan(0);
    
    // Check structure of the first hypothesis
    const firstHypothesis = hypotheses[0];
    expect(firstHypothesis).toHaveProperty("goal");
    expect(firstHypothesis).toHaveProperty("rationale");
    expect(firstHypothesis).toHaveProperty("score");
    expect(firstHypothesis).toHaveProperty("feasibilityScore");
    expect(firstHypothesis).toHaveProperty("relevanceScore");
    expect(firstHypothesis).toHaveProperty("costEstimate");
  });

  it("should refine goals based on failure reports and history", async () => {
    const engine = new GoalRefinementEngine();
    const failureReport: any = {
      originalGoal: "Book a flight.",
      failureContext: "The API failed due to invalid dates.",
      history: [{ role: "user", content: "Book a flight." }, { role: "model", content: "Please provide valid dates." }],
    };
    const initialGoal = "Book a flight.";

    // Assuming a method like refineGoalFromFailure exists
    const refinedGoal = await engine.refineGoalFromFailure(initialGoal, failureReport);

    expect(refinedGoal).toBeDefined();
    expect(typeof refinedGoal).toBe("string");
    expect(refinedGoal).toContain("valid dates");
  });
});