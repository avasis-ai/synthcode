import { describe, it, expect } from "vitest"
import { MultiObjectiveTradeoffEvaluator } from "../src/evaluation/multi-objective-tradeoff-evaluator"

describe("MultiObjectiveTradeoffEvaluator", () => {
    it("should calculate a positive score when all metrics are positive", () => {
        const evaluator = new MultiObjectiveTradeoffEvaluator({
            costWeight: 0.3,
            timeWeight: 0.2,
            safetyWeight: 0.4,
            goalProgressWeight: 0.1,
        })
        const plan = {
            id: "plan1",
            metrics: {
                cost: 10,
                time: 5,
                safety: 20,
                goal_progress: 100,
            },
        }
        const evaluatedPlan = evaluator.evaluate(plan)
        // Expected score calculation: (10 * 0.3) + (5 * 0.2) + (20 * 0.4) + (100 * 0.1)
        // 3 + 1 + 8 + 10 = 22
        expect(evaluatedPlan.score).toBeCloseTo(22)
    })

    it("should handle zero or negative metric values correctly", () => {
        const evaluator = new MultiObjectiveTradeoffEvaluator({
            costWeight: 0.5,
            timeWeight: 0.5,
            safetyWeight: 0,
            goalProgressWeight: 0,
        })
        const plan = {
            id: "plan2",
            metrics: {
                cost: 10,
                time: -5, // Negative time (e.g., improvement)
                safety: 0,
                goal_progress: 0,
            },
        }
        const evaluatedPlan = evaluator.evaluate(plan)
        // Expected score calculation: (10 * 0.5) + (-5 * 0.5) + (0 * 0) + (0 * 0)
        // 5 + (-2.5) + 0 + 0 = 2.5
        expect(evaluatedPlan.score).toBeCloseTo(2.5)
    })

    it("should return a score of zero if all weights are zero", () => {
        const evaluator = new MultiObjectiveTradeoffEvaluator({
            costWeight: 0,
            timeWeight: 0,
            safetyWeight: 0,
            goalProgressWeight: 0,
        })
        const plan = {
            id: "plan3",
            metrics: {
                cost: 100,
                time: 100,
                safety: 100,
                goal_progress: 100,
            },
        }
        const evaluatedPlan = evaluator.evaluate(plan)
        expect(evaluatedPlan.score).toBe(0)
    })
})