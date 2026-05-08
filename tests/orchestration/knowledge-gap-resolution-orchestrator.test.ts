import { describe, it, expect, vi } from "vitest";
import { KnowledgeGapResolutionOrchestrator } from "../src/orchestration/knowledge-gap-resolution-orchestrator.js";

describe("KnowledgeGapResolutionOrchestrator", () => {
    it("should generate a basic resolution plan for a given knowledge gap", async () => {
        const mockGap: any = {
            gapId: "gap-123",
            context: "The system needs information about quantum computing.",
            requiredInformation: "Details on quantum entanglement.",
            severity: "high",
        };

        // Mock dependencies
        const mockKnowledgeDetector = { detect: vi.fn(() => mockGap) };
        const mockInformationRetriever = { retrieve: vi.fn(() => ({ data: "Retrieved quantum entanglement data." })) };
        const mockKnowledgeSynthesizer = { synthesize: vi.fn(() => "Synthesized report on quantum entanglement.") };
        const mockKnowledgeValidator = { validate: vi.fn(() => ({ isValid: true, feedback: "Looks good." })) };

        const orchestrator = new KnowledgeGapResolutionOrchestrator(
            mockKnowledgeDetector,
            mockInformationRetriever,
            mockKnowledgeSynthesizer,
            mockKnowledgeValidator
        );

        const plan = await orchestrator.generateResolutionPlan(mockGap);

        expect(plan).toHaveProperty("steps");
        expect(plan.steps).toHaveLength(3);
        expect(plan.steps[0].type).toBe("retrieve");
        expect(plan.steps[1].type).toBe("synthesize");
        expect(plan.steps[2].type).toBe("validate");
    });

    it("should prioritize retrieval step if the gap is high severity", async () => {
        const mockGap: any = {
            gapId: "gap-high",
            context: "Critical failure point.",
            requiredInformation: "Immediate fix needed.",
            severity: "high",
        };

        // Mock dependencies (we only care about the plan structure here)
        const mockKnowledgeDetector = { detect: vi.fn(() => mockGap) };
        const mockInformationRetriever = { retrieve: vi.fn() };
        const mockKnowledgeSynthesizer = { synthesize: vi.fn() };
        const mockKnowledgeValidator = { validate: vi.fn() };

        const orchestrator = new KnowledgeGapResolutionOrchestrator(
            mockKnowledgeDetector,
            mockInformationRetriever,
            mockKnowledgeSynthesizer,
            mockKnowledgeValidator
        );

        const plan = await orchestrator.generateResolutionPlan(mockGap);

        // Check if the first step is retrieval and has high priority
        expect(plan.steps[0].type).toBe("retrieve");
        expect(plan.steps[0].sourcePriority).toBeGreaterThanOrEqual(1);
    });

    it("should handle gaps that require only synthesis and validation steps", async () => {
        const mockGap: any = {
            gapId: "gap-low",
            context: "Minor improvement needed.",
            requiredInformation: "Summary of existing documents.",
            severity: "low",
        };

        // Mock dependencies
        const mockKnowledgeDetector = { detect: vi.fn(() => mockGap) };
        const mockInformationRetriever = { retrieve: vi.fn() };
        const mockKnowledgeSynthesizer = { synthesize: vi.fn() };
        const mockKnowledgeValidator = { validate: vi.fn() };

        const orchestrator = new KnowledgeGapResolutionOrchestrator(
            mockKnowledgeDetector,
            mockInformationRetriever,
            mockKnowledgeSynthesizer,
            mockKnowledgeValidator
        );

        // Simulate a gap that might skip retrieval if context is already rich
        // (Assuming the orchestrator logic handles this based on context/severity)
        // For testing purposes, we assume a specific gap structure that triggers this path.
        const plan = await orchestrator.generateResolutionPlan(mockGap);

        // We expect at least synthesis and validation, potentially skipping retrieval
        expect(plan.steps).toHaveLength(2);
        expect(plan.steps[0].type).toBe("synthesize");
        expect(plan.steps[1].type).toBe("validate");
    });
});