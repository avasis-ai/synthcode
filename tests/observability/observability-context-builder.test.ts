import { describe, it, expect } from "vitest"
import { buildObservabilityContext } from "../src/observability/observability-context-builder"

describe("buildObservabilityContext", () => {
    it("should build a basic context when all inputs are provided", () => {
        const costMetrics = {
            estimatedCostUSD: 150.75,
            breakdown: { compute: 100, storage: 50.75 },
            isCostEstimate: true,
        }
        const resourceUsage = {
            cpuUtilizationPercent: 75,
            memoryUsageBytes: 512 * 1024 * 1024,
            executionTimeMs: 3500,
            isPeakUsage: true,
        }
        const governanceStatus = {
            hasViolations: false,
            violationCount: 0,
            complianceScore: 95,
            violationDetails: [],
        }
        const driftIndicators = {
            isDrifting: false,
            driftScore: 0.9,
            lastChecked: new Date().toISOString(),
        }

        const context = buildObservabilityContext(
            costMetrics,
            resourceUsage,
            governanceStatus,
            driftIndicators
        )

        expect(context).toBeDefined()
        expect(context.costMetrics).toEqual(costMetrics)
        expect(context.resourceUsage).toEqual(resourceUsage)
        expect(context.governanceStatus).toEqual(governanceStatus)
        expect(context.driftIndicators).toEqual(driftIndicators)
    })

    it("should handle missing or default values gracefully", () => {
        // Simulate missing/default values
        const costMetrics = {
            estimatedCostUSD: 0,
            breakdown: {},
            isCostEstimate: false,
        }
        const resourceUsage = {
            cpuUtilizationPercent: 0,
            memoryUsageBytes: 0,
            executionTimeMs: 0,
            isPeakUsage: false,
        }
        const governanceStatus = {
            hasViolations: false,
            violationCount: 0,
            complianceScore: 100,
            violationDetails: [],
        }
        const driftIndicators = {
            isDrifting: false,
            driftScore: 0,
            lastChecked: null,
        }

        const context = buildObservabilityContext(
            costMetrics,
            resourceUsage,
            governanceStatus,
            driftIndicators
        )

        expect(context).toBeDefined()
        expect(context.costMetrics).toEqual(costMetrics)
        expect(context.resourceUsage).toEqual(resourceUsage)
        expect(context.governanceStatus).toEqual(governanceStatus)
        expect(context.driftIndicators).toEqual(driftIndicators)
    })

    it("should correctly combine and structure the context object", () => {
        const costMetrics = { estimatedCostUSD: 10, breakdown: { a: 1 }, isCostEstimate: true }
        const resourceUsage = { cpuUtilizationPercent: 50, memoryUsageBytes: 100, executionTimeMs: 1000, isPeakUsage: false }
        const governanceStatus = { hasViolations: true, violationCount: 1, complianceScore: 80, violationDetails: ["A"] }
        const driftIndicators = { isDrifting: true, driftScore: 0.5, lastChecked: "2023-01-01T00:00:00Z" }

        const context = buildObservabilityContext(
            costMetrics,
            resourceUsage,
            governanceStatus,
            driftIndicators
        )

        expect(context.costMetrics).toEqual(costMetrics)
        expect(context.resourceUsage).toEqual(resourceUsage)
        expect(context.governanceStatus).toEqual(governanceStatus)
        expect(context.driftIndicators).toEqual(driftIndicators)
    })
})