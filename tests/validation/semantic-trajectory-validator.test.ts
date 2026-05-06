import { describe, it, expect } from "vitest"
import { SemanticTrajectoryValidator } from "../src/validation/semantic-trajectory-validator"

describe("SemanticTrajectoryValidator", () => {
    it("should initialize correctly and validate a perfect trajectory", () => {
        const validator = new SemanticTrajectoryValidator("initial_goal", 0.7)
        // Assuming a perfect trajectory means no drift
        const is_valid = validator.validate(
            "initial_goal",
            [
                "step1",
                "step2",
                "final_goal"
            ]
        )
        expect(is_valid).toBe(true)
    })

    it("should detect significant semantic drift when the trajectory deviates", () => {
        const validator = new SemanticTrajectoryValidator("initial_goal", 0.7)
        // Simulate a trajectory that deviates significantly
        const is_valid = validator.validate(
            "initial_goal",
            [
                "step1",
                "step2",
                "unexpected_deviation"
            ]
        )
        expect(is_valid).toBe(false)
    })

    it("should handle edge case with a very high drift threshold", () => {
        // Setting a high threshold means the validator is very lenient
        const validator = new SemanticTrajectoryValidator("initial_goal", 1.5)
        // Even with a deviation, a high threshold might pass (depending on internal logic)
        // We test that it doesn't throw and returns a predictable result
        const is_valid = validator.validate(
            "initial_goal",
            [
                "step1",
                "step2",
                "slight_deviation"
            ]
        )
        // Assuming that with a very high threshold, the validation passes
        expect(is_valid).toBe(true)
    })
})