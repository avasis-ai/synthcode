import { describe, it, expect, vi } from "vitest";
import { HypothesisCoordinator } from "../src/validation/hypothesis-validation-coordinator";
import { Hypothesis } from "../src/validation/hypothesis-validation-coordinator.types";

describe("HypothesisCoordinator", () => {
    it("should initialize with a valid hypothesis and state", () => {
        const initialHypothesis: Hypothesis = {
            id: "h1",
            claim: "The sky is blue",
            requiredEvidence: ["color_data"],
            confidenceWeights: { "sourceA": 0.8, "sourceB": 0.2 },
            state: "PENDING",
            evidenceReceived: {}
        };
        const coordinator = new HypothesisCoordinator(initialHypothesis);
        expect(coordinator.getHypothesis()).toBe(initialHypothesis);
        expect(coordinator.getHypothesis().id).toBe("h1");
        expect(coordinator.getHypothesis().state).toBe("PENDING");
    });

    it("should transition state to EVIDENCE_GATHERING upon initial processing", () => {
        const initialHypothesis: Hypothesis = {
            id: "h2",
            claim: "The capital is Paris",
            requiredEvidence: ["geography_data"],
            confidenceWeights: {},
            state: "PENDING",
            evidenceReceived: {}
        };
        const coordinator = new HypothesisCoordinator(initialHypothesis);
        // Simulate initial processing step
        coordinator.processMessage(null as any); 
        expect(coordinator.getHypothesis().state).toBe("EVIDENCE_GATHERING");
    });

    it("should update evidence and potentially change state upon receiving tool results", () => {
        const initialHypothesis: Hypothesis = {
            id: "h3",
            claim: "The event happened in 2023",
            requiredEvidence: ["timeline_data"],
            confidenceWeights: {},
            state: "EVIDENCE_GATHERING",
            evidenceReceived: {}
        };
        const coordinator = new HypothesisCoordinator(initialHypothesis);

        // Simulate receiving evidence
        const toolResult = {
            type: "tool_result",
            content: {
                toolResult: {
                    toolName: "timeline_data",
                    result: "The event occurred in 2023."
                }
            }
        };

        coordinator.processMessage(toolResult as any);

        const updatedHypothesis = coordinator.getHypothesis();
        expect(updatedHypothesis.evidenceReceived["timeline_data"]).toContain("The event occurred in 2023.");
        // Assuming receiving evidence moves it towards RESOLVED if enough is gathered
        expect(updatedHypothesis.state).toBe("EVIDENCE_GATHERING"); 
    });
});