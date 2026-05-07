import { describe, it, expect, vi } from "vitest";
import { NegotiationEngine } from "../../../src/negotiation/service-negotiation-engine";

describe("NegotiationEngine", () => {
    it("should calculate a high score when all criteria are met", async () => {
        const engine = new NegotiationEngine();
        const providers = [
            {
                id: "p1",
                name: "Provider A",
                cost: 100,
                slaScore: 0.95,
                schemaCompatibility: 0.9,
                predictedPerformanceScore: 0.95,
                metadata: { reliability: "high" },
            },
            {
                id: "p2",
                name: "Provider B",
                cost: 200,
                slaScore: 0.8,
                schemaCompatibility: 0.7,
                predictedPerformanceScore: 0.8,
                metadata: { reliability: "medium" },
            },
        ];

        const report = await engine.generateReport(providers);

        expect(report.length).toBe(2);
        // Check if the best provider (p1) has a significantly higher score than the second (p2)
        expect(report[0].providerId).toBe("p1");
        expect(report[0].score).toBeGreaterThan(report[1].score);
    });

    it("should handle an empty list of providers gracefully", async () => {
        const engine = new NegotiationEngine();
        const providers: any[] = [];

        const report = await engine.generateReport(providers);

        expect(report).toEqual([]);
    });

    it("should prioritize cost-effectiveness and performance when scores are close", async () => {
        const engine = new NegotiationEngine();
        const providers = [
            {
                id: "p3",
                name: "Provider C",
                cost: 50,
                slaScore: 0.8,
                schemaCompatibility: 0.8,
                predictedPerformanceScore: 0.8,
                metadata: {},
            },
            {
                id: "p4",
                name: "Provider D",
                cost: 60,
                slaScore: 0.9,
                schemaCompatibility: 0.9,
                predictedPerformanceScore: 0.9,
                metadata: {},
            },
        ];

        const report = await engine.generateReport(providers);

        // Provider C is cheaper, but Provider D has slightly better scores.
        // The engine should balance these factors, but the difference should be noticeable.
        expect(report[0].providerId).toBe("p4");
        expect(report[0].score).toBeGreaterThanOrEqual(report[1].score);
    });
});