import { describe, it, expect } from "vitest"
import { ComplexityBudgetValidator } from "../src/validation/complexity-budget-validator"

describe("ComplexityBudgetValidator", () => {
    it("should return true when the complexity is within the budget", () => {
        const validator = new ComplexityBudgetValidator(100)
        const complexity = 50
        expect(validator.isValid(complexity)).toBe(true)
    })

    it("should return false when the complexity exceeds the budget", () => {
        const validator = new ComplexityBudgetValidator(100)
        const complexity = 150
        expect(validator.isValid(complexity)).toBe(false)
    })

    it("should return false when the budget is negative and complexity is positive", () => {
        const validator = new ComplexityBudgetValidator(-10)
        const complexity = 5
        expect(validator.isValid(complexity)).toBe(false)
    })
})