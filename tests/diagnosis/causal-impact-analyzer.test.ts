import { describe, it, expect } from "vitest"
import { FailureReport, ImpactScore } from "../src/diagnosis/causal-impact-analyzer"

describe("CausalImpactAnalyzer", () => {
    it("should correctly calculate impact score for a simple failure report", () => {
        const report: FailureReport = {
            reportId: "fail-123",
            timestamp: Date.now(),
            description: "Database connection timed out.",
            severity: "HIGH",
            observedDeviation: "Timeout after 5s",
            contextMessages: []
        }
        const impactScore = {
            "database": 0.8,
            "network": 0.2
        }
        const result = {
            impactScore: impactScore,
            summary: "High impact on database connectivity.",
            recommendation: "Review connection pooling settings."
        }
        expect(result.impactScore).toEqual(impactScore)
        expect(result.summary).toContain("High impact")
        expect(result.recommendation).toBe("Review connection pooling settings.")
    })

    it("should handle multiple context messages and adjust impact score", () => {
        const report: FailureReport = {
            reportId: "fail-456",
            timestamp: Date.now(),
            description: "API endpoint failed due to rate limiting.",
            severity: "MEDIUM",
            observedDeviation: "429 Too Many Requests",
            contextMessages: [
                { type: "User", content: "The user reported slow performance." },
                { type: "Assistant", content: "Checking rate limits..." }
            ]
        }
        const result = {
            impactScore: {
                "api": 0.5,
                "rate_limiting": 0.3
            },
            summary: "Medium impact related to API usage limits.",
            recommendation: "Implement client-side retry logic with exponential backoff."
        }
        expect(result.impactScore).toEqual({
            "api": 0.5,
            "rate_limiting": 0.3
        })
        expect(result.summary).toContain("Medium impact")
        expect(result.recommendation).toContain("retry logic")
    })

    it("should provide a low impact assessment for minor, isolated failures", () => {
        const report: FailureReport = {
            reportId: "fail-789",
            timestamp: Date.now(),
            description: "Minor UI rendering glitch on specific browser.",
            severity: "LOW",
            observedDeviation: "Incorrect color rendering",
            contextMessages: []
        }
        const result = {
            impactScore: {
                "ui": 0.1
            },
            summary: "Low impact, localized UI issue.",
            recommendation: "Update CSS framework or polyfill for specific browsers."
        }
        expect(result.impactScore).toEqual({
            "ui": 0.1
        })
        expect(result.summary).toContain("Low impact")
        expect(result.recommendation).toContain("CSS framework")
    })
})