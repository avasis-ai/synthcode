import { describe, it, expect } from "vitest"
import { ResourceNegotiationEngine } from "../src/resource/resource-negotiation-engine.js"

describe("ResourceNegotiationEngine", () => {
    it("should successfully negotiate resources when constraints are met", async () => {
        const engine = new ResourceNegotiationEngine()
        const initialUsage: Record<string, number> = { budget: 100, time: 50 }
        const constraints: ResourceConstraint[] = [
            {
                name: "budget",
                limit: 100,
                usage: { budget: 10 },
                checkFn: (currentUsage, stepUsage) => (currentUsage["budget"]! + stepUsage["budget"]! <= 100),
            },
            {
                name: "time",
                limit: 50,
                usage: { time: 20 },
                checkFn: (currentUsage, stepUsage) => (currentUsage["time"]! + stepUsage["time"]! <= 50),
            },
        ]
        const planStep: PlanStep = {
            stepId: "step1",
            requiredResources: { budget: 30, time: 10 },
        }

        const result = await engine.negotiate(planStep, constraints, initialUsage)

        expect(result.isNegotiable).toBe(true)
        expect(result.negotiatedResources).toEqual({ budget: 30, time: 10 })
    })

    it("should fail negotiation when resource constraints are exceeded", async () => {
        const engine = new ResourceNegotiationEngine()
        const initialUsage: Record<string, number> = { budget: 90, time: 40 }
        const constraints: ResourceConstraint[] = [
            {
                name: "budget",
                limit: 100,
                usage: { budget: 10 },
                checkFn: (currentUsage, stepUsage) => (currentUsage["budget"]! + stepUsage["budget"]! <= 100),
            },
            {
                name: "time",
                limit: 50,
                usage: { time: 20 },
                checkFn: (currentUsage, stepUsage) => (currentUsage["time"]! + stepUsage["time"]! <= 50),
            },
        ]
        const planStep: PlanStep = {
            stepId: "step2",
            requiredResources: { budget: 20, time: 20 }, // Exceeds budget (90+20=110 > 100)
        }

        const result = await engine.negotiate(planStep, constraints, initialUsage)

        expect(result.isNegotiable).toBe(false)
        expect(result.negotiatedResources).toEqual({})
    })

    it("should handle missing required resources gracefully", async () => {
        const engine = new ResourceNegotiationEngine()
        const initialUsage: Record<string, number> = { budget: 50 }
        const constraints: ResourceConstraint[] = [
            {
                name: "budget",
                limit: 100,
                usage: { budget: 10 },
                checkFn: (currentUsage, stepUsage) => (currentUsage["budget"]! + stepUsage["budget"]! <= 100),
            },
        ]
        const planStep: PlanStep = {
            stepId: "step3",
            requiredResources: { time: 10 }, // 'time' is not constrained
        }

        const result = await engine.negotiate(planStep, constraints, initialUsage)

        expect(result.isNegotiable).toBe(true)
        expect(result.negotiatedResources).toEqual({ time: 10 })
    })
})