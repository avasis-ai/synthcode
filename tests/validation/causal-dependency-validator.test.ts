import { describe, it, expect } from "vitest"
import { validateCausalDependencies } from "../src/validation/causal-dependency-validator"

describe("validateCausalDependencies", () => {
    it("should return true for a valid sequence of steps", () => {
        const steps = [
            {
                id: "step1",
                action: "create",
                prerequisites: {},
                output: { user: "alice" },
            },
            {
                id: "step2",
                action: "update",
                prerequisites: { user: "user_id" },
                output: { status: "active" },
            },
        ]
        const result = validateCausalDependencies(steps)
        expect(result).toBe(true)
    })

    it("should return false if a step requires a prerequisite that is missing", () => {
        const steps = [
            {
                id: "step1",
                action: "create",
                prerequisites: { user: "user_id" }, // Requires user_id
                output: { user: "alice" },
            },
            {
                id: "step2",
                action: "update",
                prerequisites: { missing_key: "some_value" }, // Missing key
                output: { status: "active" },
            },
        ]
        const result = validateCausalDependencies(steps)
        expect(result).toBe(false)
    })

    it("should handle complex dependencies correctly", () => {
        const steps = [
            {
                id: "stepA",
                action: "init",
                prerequisites: {},
                output: { data: "initial_data" },
            },
            {
                id: "stepB",
                action: "process",
                prerequisites: { data: "data_value" },
                output: { processed: true },
            },
            {
                id: "stepC",
                action: "finalize",
                prerequisites: { processed: "true" },
                output: { final: true },
            },
        ]
        const result = validateCausalDependencies(steps)
        expect(result).toBe(true)
    })
})