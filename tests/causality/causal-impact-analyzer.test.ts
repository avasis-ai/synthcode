import { describe, it, expect } from "vitest";
import { CausalImpactAnalyzer } from "../src/causality/causal-impact-analyzer";
import { FailureReport, ContextGraph } from "../src/causality/types";

describe("CausalImpactAnalyzer", () => {
    it("should calculate a basic causality score when a direct dependency exists", () => {
        const failureReport: FailureReport = {
            failurePoint: "ServiceA",
            failedComponents: ["ServiceA"],
        };
        const graph: ContextGraph = {
            nodes: [
                { id: "ServiceA", name: "Service A" },
                { id: "ServiceB", name: "Service B" },
            ],
            dependencies: [
                { source: "ServiceA", target: "ServiceB" }
            ]
        };
        const analyzer = new CausalImpactAnalyzer(failureReport, graph);
        // Assuming the internal method calculateCausalityScore is tested indirectly
        // We test the overall impact analysis which relies on this score.
        const impactReport = analyzer.analyzeImpact("ServiceA");
        expect(impactReport.isCritical).toBe(true);
        expect(impactReport.impactScore).toBeGreaterThan(0);
    });

    it("should return a low impact score if the failed component has no dependencies", () => {
        const failureReport: FailureReport = {
            failurePoint: "ServiceC",
            failedComponents: ["ServiceC"],
        };
        const graph: ContextGraph = {
            nodes: [
                { id: "ServiceA", name: "Service A" },
                { id: "ServiceC", name: "Service C" },
            ],
            dependencies: [
                { source: "ServiceA", target: "ServiceC" }
            ]
        };
        const analyzer = new CausalImpactAnalyzer(failureReport, graph);
        const impactReport = analyzer.analyzeImpact("ServiceC");
        expect(impactReport.isCritical).toBe(false);
        expect(impactReport.impactScore).toBeCloseTo(0);
    });

    it("should generate a correction plan suggesting upstream fixes when impact is high", () => {
        const failureReport: FailureReport = {
            failurePoint: "ServiceD",
            failedComponents: ["ServiceD"],
        };
        const graph: ContextGraph = {
            nodes: [
                { id: "ServiceE", name: "Service E" },
                { id: "ServiceF", name: "Service F" },
                { id: "ServiceD", name: "Service D" },
            ],
            dependencies: [
                { source: "ServiceE", target: "ServiceF" },
                { source: "ServiceF", target: "ServiceD" }
            ]
        };
        const analyzer = new CausalImpactAnalyzer(failureReport, graph);
        const impactReport = analyzer.analyzeImpact("ServiceD");
        const correctionPlan = analyzer.generateCorrectionPlan(impactReport);

        expect(impactReport.isCritical).toBe(true);
        expect(correctionPlan.suggestedActions.length).toBeGreaterThan(0);
        // Check if the plan suggests fixing an upstream component (ServiceE or ServiceF)
        expect(correctionPlan.suggestedActions[0].componentId).toMatch(/ServiceE|ServiceF/);
    });
});