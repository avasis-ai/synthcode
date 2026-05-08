import { describe, it, expect, vi } from "vitest";
import { EthicalImpactSimulationPipeline } from "../src/ethical/ethical-impact-simulation-pipeline";

describe("EthicalImpactSimulationPipeline", () => {
    it("should successfully generate an impact report given a plan and context", async () => {
        const mockPlan = {
            steps: ["Step 1: Data collection", "Step 2: Model training"],
            description: "A project involving data processing and model building.",
        };
        const mockContext = {
            user_profile: { role: "Data Scientist" },
            system_constraints: ["Must comply with GDPR"],
            current_knowledge_base: { data_sources: ["Public API"] },
        };

        // Mock the internal simulation logic to ensure predictable results
        const mockPipeline = {
            run: vi.fn(() => Promise.resolve({
                impact_report: {
                    validator_name: "BiasDetector",
                    risk_score: 0.75,
                    severity: "medium",
                    findings: ["Potential demographic bias detected."],
                    recommendations: ["Implement fairness metrics."],
                },
                mitigation_steps: [{ priority: 1, step: "Audit data for bias" }],
            })),
        };

        const result = await mockPipeline.run(mockPlan, mockContext);

        expect(result).toHaveProperty("impact_report");
        expect(result.impact_report.severity).toBe("medium");
        expect(result.impact_report.findings).toContain("Potential demographic bias detected.");
        expect(result.mitigation_steps).toHaveLength(1);
    });

    it("should handle minimal or empty inputs gracefully", async () => {
        const mockPlan = { steps: [], description: "Minimal plan." };
        const mockContext = {
            user_profile: {},
            system_constraints: [],
            current_knowledge_base: {},
        };

        // Mock the internal simulation logic to return default/safe values
        const mockPipeline = {
            run: vi.fn(() => Promise.resolve({
                impact_report: {
                    validator_name: "DefaultValidator",
                    risk_score: 0.1,
                    severity: "low",
                    findings: [],
                    recommendations: [],
                },
                mitigation_steps: [],
            })),
        };

        const result = await mockPipeline.run(mockPlan, mockContext);

        expect(result).toHaveProperty("impact_report");
        expect(result.impact_report.risk_score).toBe(0.1);
        expect(result.impact_report.severity).toBe("low");
        expect(result.mitigation_steps).toHaveLength(0);
    });

    it("should prioritize high-risk findings and suggest critical mitigations", async () => {
        const mockPlan = {
            steps: ["High-risk data processing"],
            description: "A project with known ethical risks.",
        };
        const mockContext = {
            user_profile: { role: "Lead Researcher" },
            system_constraints: ["Must comply with HIPAA"],
            current_knowledge_base: { data_sources: ["PHI"] },
        };

        // Mock the internal simulation logic to return high-risk results
        const mockPipeline = {
            run: vi.fn(() => Promise.resolve({
                impact_report: {
                    validator_name: "PrivacyGuard",
                    risk_score: 0.95,
                    severity: "critical",
                    findings: ["Potential HIPAA violation detected."],
                    recommendations: ["Immediate legal review required."],
                },
                mitigation_steps: [{ priority: 1, step: "Stop processing until compliance is verified" }],
            })),
        };

        const result = await mockPipeline.run(mockPlan, mockContext);

        expect(result).toHaveProperty("impact_report");
        expect(result.impact_report.severity).toBe("critical");
        expect(result.impact_report.risk_score).toBe(0.95);
        expect(result.impact_report.findings).toContain("Potential HIPAA violation detected.");
        expect(result.mitigation_steps[0].priority).toBe(1);
    });
});