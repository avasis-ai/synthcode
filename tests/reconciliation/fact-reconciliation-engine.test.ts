import { describe, it, expect } from "vitest"
import { FactReconciliationEngine } from "../src/reconciliation/fact-reconciliation-engine.js"

describe("FactReconciliationEngine", () => {
    it("should calculate consensus and conflict report for multiple facts", () => {
        const engine = new FactReconciliationEngine()
        const facts: Fact[] = [
            { attribute: "A", value: 10, sourceId: "S1", timestamp: 1, confidence: 0.8 },
            { attribute: "A", value: 12, sourceId: "S2", timestamp: 2, confidence: 0.9 },
            { attribute: "A", value: 10, sourceId: "S3", timestamp: 3, confidence: 0.7 },
        ]
        const result = engine.reconcileFacts(facts)

        expect(result.consensusValue).toBe(10)
        expect(result.aggregatedConfidence).toBeCloseTo(2.4)
        expect(result.conflictReport.conflictingValues.has(10)).toBe(true)
        expect(result.conflictReport.conflictingValues.has(12)).toBe(true)
    })

    it("should handle cases with only one fact", () => {
        const engine = new FactReconciliationEngine()
        const facts: Fact[] = [
            { attribute: "B", value: "test", sourceId: "S4", timestamp: 4, confidence: 0.95 },
        ]
        const result = engine.reconcileFacts(facts)

        expect(result.consensusValue).toBe("test")
        expect(result.aggregatedConfidence).toBe(0.95)
        expect(result.conflictReport.conflictingValues.size).toBe(1)
        expect(result.conflictReport.conflictingValues.has("test")).toBe(true)
    })

    it("should handle empty list of facts", () => {
        const engine = new FactReconciliationEngine()
        const facts: Fact[] = []
        const result = engine.reconcileFacts(facts)

        expect(result.consensusValue).toBeNull()
        expect(result.aggregatedConfidence).toBe(0)
        expect(result.conflictReport.conflictingValues.size).toBe(0)
    })
})