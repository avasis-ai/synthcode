import { describe, it, expect } from "vitest";
import { PlanRiskEvaluator } from "../src/risk/plan-risk-evaluator.js";

describe("PlanRiskEvaluator", () => {
    it("should calculate overall risk score correctly based on weights", () => {
        const evaluator = new PlanRiskEvaluator();
        const plan = {
            cost: 0.8,
            compliance: 0.5,
            novelty: 0.9,
            resource: 0.6,
        };
        // Expected calculation: (0.8 * 0.3) + (0.5 * 0.3) + (0.9 * 0.2) + (0.6 * 0.2) = 0.24 + 0.15 + 0.18 + 0.12 = 0.69
        const score = evaluator.calculateOverallScore(plan);
        expect(score).toBeCloseTo(0.69);
    });

    it("should correctly determine the recommendation based on the overall score", () => {
        const evaluator = new PlanRiskEvaluator();

        // Case 1: Low risk (PROCEED)
        const lowRiskPlan = { cost: 0.2, compliance: 0.3, novelty: 0.1, resource: 0.2 };
        expect(evaluator.getRecommendation(lowRiskPlan)).toBe('PROCEED');

        // Case 2: Medium risk (REVIEW)
        const mediumRiskPlan = { cost: 0.6, compliance: 0.5, novelty: 0.5, resource: 0.5 };
        expect(evaluator.getRecommendation(mediumRiskPlan)).toBe('REVIEW');

        // Case 3: High risk (ABORT)
        const highRiskPlan = { cost: 0.9, compliance: 0.8, novelty: 0.9, resource: 0.9 };
        expect(evaluator.getRecommendation(highRiskPlan)).toBe('ABORT');
    });

    it("should generate a comprehensive risk report", () => {
        const evaluator = new PlanRiskEvaluator();
        const plan = {
            cost: 0.7,
            compliance: 0.4,
            novelty: 0.8,
            resource: 0.5,
        };

        const report = evaluator.generateReport(plan);

        expect(report).toBeDefined();
        expect(typeof report.overallScore).toBe('number');
        expect(typeof report.costRisk).toBe('number');
        expect(typeof report.complianceRisk).toBe('number');
        expect(typeof report.noveltyRisk).toBe('number');
        expect(typeof report.resourceContentionRisk).toBe('number');
        expect(['PROCEED', 'REVIEW', 'ABORT']).toContain(report.recommendation);
    });
});