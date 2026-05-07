import { describe, it, expect } from "vitest"
import {
    ImpactAssessmentValidator,
    ResourceConstraints,
    ProposedAction,
    ImpactAssessmentContext,
} from "../src/validation/impact-assessment-validator"

describe("ImpactAssessmentValidator", () => {
    const mockContext: ImpactAssessmentContext = {
        currentState: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Analyze the impact of implementing a new feature." },
                ],
            },
        ],
        constraint: {
            maxMemoryGB: 10,
            maxApiCalls: 100,
            availableBudget: 5000,
        },
    }

    it("should validate a simple, resource-friendly proposed action", async () => {
        const proposedAction: ProposedAction = {
            toolName: "calculator",
            input: {
                operation: "add",
                a: 5,
                b: 10,
            },
            description: "Calculate the sum of two numbers.",
        }

        const result = await ImpactAssessmentValidator.validate(
            proposedAction,
            mockContext
        )

        expect(result.isValid).toBe(true)
        expect(result.reason).toBeNull()
    })

    it("should fail validation if the proposed action exceeds memory constraints", async () => {
        const proposedAction: ProposedAction = {
            toolName: "large_model_analysis",
            input: {
                dataSizeGB: 15,
            },
            description: "Perform a deep analysis requiring significant memory.",
        }

        const mockContextWithLowMemory: ImpactAssessmentContext = {
            currentState: mockContext.currentState,
            constraint: {
                maxMemoryGB: 10,
                maxApiCalls: 100,
                availableBudget: 5000,
            },
        }

        const result = await ImpactAssessmentValidator.validate(
            proposedAction,
            mockContextWithLowMemory
        )

        expect(result.isValid).toBe(false)
        expect(result.reason).toContain("exceeds memory constraints")
    })

    it("should fail validation if the proposed action exceeds budget constraints", async () => {
        const proposedAction: ProposedAction = {
            toolName: "premium_service_api",
            input: {
                cost: 6000,
            },
            description: "Use a high-cost, premium external API.",
        }

        const mockContextWithLowBudget: ImpactAssessmentContext = {
            currentState: mockContext.currentState,
            constraint: {
                maxMemoryGB: 10,
                maxApiCalls: 100,
                availableBudget: 4000,
            },
        }

        const result = await ImpactAssessmentValidator.validate(
            proposedAction,
            mockContextWithLowBudget
        )

        expect(result.isValid).toBe(false)
        expect(result.reason).toContain("exceeds budget constraints")
    })
})