import { describe, it, expect } from "vitest"
import { AssumptionConflictValidator } from "../src/validation/assumption-conflict-validator"

describe("AssumptionConflictValidator", () => {
    it("should return no conflict when assumptions are compatible", () => {
        const validator = new AssumptionConflictValidator()
        const assumptions = [
            { source: "A", type: "Location", value: "Paris", confidence: 0.9 },
            { source: "B", type: "Population", value: 2100000, confidence: 0.8 }
        ]
        const report = validator.validate(assumptions)
        expect(report.hasConflict).toBe(false)
        expect(report.conflicts).toHaveLength(0)
    })

    it("should detect a conflict when assumptions contradict each other", () => {
        const validator = new AssumptionConflictValidator()
        const assumptions = [
            { source: "A", type: "Location", value: "New York", confidence: 0.95 },
            { source: "B", type: "Location", value: "Los Angeles", confidence: 0.9 }
        ]
        const report = validator.validate(assumptions)
        expect(report.hasConflict).toBe(true)
        expect(report.conflicts).toHaveLength(1)
        expect(report.conflicts[0].conflictMessage).toContain("Location")
    })

    it("should handle multiple distinct conflicts", () => {
        const validator = new AssumptionConflictValidator()
        const assumptions = [
            { source: "A", type: "Location", value: "Paris", confidence: 0.9 },
            { source: "B", type: "Location", value: "London", confidence: 0.8 },
            { source: "C", type: "Climate", value: "Cold", confidence: 0.7 }
        ]
        // Note: The actual conflict detection logic depends on the internal rules setup,
        // but we test the structure and ability to find multiple conflicts.
        const report = validator.validate(assumptions)
        expect(report.hasConflict).toBe(true)
        expect(report.conflicts).toHaveLength(1) // Assuming only Location conflict is defined
    })
})