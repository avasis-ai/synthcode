import { describe, it, expect } from "vitest"
import { Rule, Fact, Conflict } from "../src/validation/temporal-fact-consistency-validator"

describe("temporal-fact-consistency-validator", () => {
    it("should validate a set of facts against a rule and return no conflict if consistent", () => {
        const rule: Rule = {
            ruleId: "R1",
            checkFunc: (facts: Fact[]): Conflict | null => {
                if (facts.length < 2) return null
                // Simple consistency check: ensure timestamps are increasing
                for (let i = 0; i < facts.length - 1; i++) {
                    if (facts[i].timestamp >= facts[i + 1].timestamp) {
                        return {
                            ruleId: "R1",
                            message: "Timestamps must be strictly increasing.",
                            severity: "HIGH",
                            factsInvolved: [facts[i], facts[i + 1]],
                        }
                    }
                }
                return null
            }
        }

        const consistentFacts: Fact[] = [
            { sourceId: "A", timestamp: 100, factPayload: { key: "val1" }, confidence: 0.9 },
            { sourceId: "B", timestamp: 200, factPayload: { key: "val2" }, confidence: 0.8 },
            { sourceId: "C", timestamp: 300, factPayload: { key: "val3" }, confidence: 0.7 },
        ]

        const conflict: Conflict | null = rule.checkFunc(consistentFacts)
        expect(conflict).toBeNull()
    })

    it("should detect a conflict when timestamps are non-increasing", () => {
        const rule: Rule = {
            ruleId: "R1",
            checkFunc: (facts: Fact[]): Conflict | null => {
                // Simple consistency check: ensure timestamps are strictly increasing
                for (let i = 0; i < facts.length - 1; i++) {
                    if (facts[i].timestamp >= facts[i + 1].timestamp) {
                        return {
                            ruleId: "R1",
                            message: "Timestamps must be strictly increasing.",
                            severity: "HIGH",
                            factsInvolved: [facts[i], facts[i + 1]],
                        }
                    }
                }
                return null
            }
        }

        const inconsistentFacts: Fact[] = [
            { sourceId: "A", timestamp: 100, factPayload: { key: "val1" }, confidence: 0.9 },
            { sourceId: "B", timestamp: 200, factPayload: { key: "val2" }, confidence: 0.8 },
            { sourceId: "C", timestamp: 200, factPayload: { key: "val3" }, confidence: 0.7 }, // Duplicate timestamp
        ]

        const conflict: Conflict | null = rule.checkFunc(inconsistentFacts)
        expect(conflict).not.toBeNull()
        expect(conflict?.ruleId).toBe("R1")
        expect(conflict?.severity).toBe("HIGH")
        expect(conflict?.factsInvolved).toHaveLength(2)
    })

    it("should handle empty or single-fact arrays without reporting a conflict", () => {
        const rule: Rule = {
            ruleId: "R1",
            checkFunc: (facts: Fact[]): Conflict | null => {
                // Simple consistency check: ensure timestamps are strictly increasing
                if (facts.length < 2) return null
                for (let i = 0; i < facts.length - 1; i++) {
                    if (facts[i].timestamp >= facts[i + 1].timestamp) {
                        return {
                            ruleId: "R1",
                            message: "Timestamps must be strictly increasing.",
                            severity: "HIGH",
                            factsInvolved: [facts[i], facts[i + 1]],
                        }
                    }
                }
                return null
            }
        }

        // Case 1: Empty array
        let conflict = rule.checkFunc([]);
        expect(conflict).toBeNull()

        // Case 2: Single fact
        const singleFact: Fact[] = [{ sourceId: "A", timestamp: 100, factPayload: {}, confidence: 1.0 }]
        conflict = rule.checkFunc(singleFact)
        expect(conflict).toBeNull()
    })
})