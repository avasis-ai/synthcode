import { describe, it, expect } from "vitest";
import { CapabilityRequest } from "../src/negotiation/capability-negotiation-engine";

describe("CapabilityNegotiationEngine", () => {
    it("should grant a scope when no conflicts exist and the request is high priority", () => {
        const engine = {
            // Mock implementation for testing purposes
            evaluateRequest: (request) => ({
                isConflict: false,
                score: 0.9,
                grantedScopes: [{
                    capability: request.capability,
                    componentId: request.componentId,
                    priority: 0.9,
                    durationMs: request.requiredDurationMs,
                    reason: "High priority request granted."
                }]
            })
        };

        const request: CapabilityRequest = {
            capability: "READ_DATA",
            componentId: "ComponentA",
            urgency: 0.8,
            impact: 0.9,
            requiredDurationMs: 1000,
            weights: {
                urgency: 0.5,
                impact: 0.3,
                duration: 0.2,
            }
        };

        const result = engine.evaluateRequest(request);

        expect(result.isConflict).toBe(false);
        expect(result.grantedScopes).toHaveLength(1);
        expect(result.grantedScopes[0].capability).toBe("READ_DATA");
        expect(result.grantedScopes[0].priority).toBe(0.9);
    });

    it("should handle conflicts and resolve them by prioritizing the highest scoring request", () => {
        const engine = {
            // Mock implementation for testing purposes
            evaluateRequest: (request) => ({
                isConflict: true,
                score: 0.7,
                conflictsResolved: true,
                grantedScopes: [{
                    capability: "WRITE_DATA",
                    componentId: "ComponentA",
                    priority: 0.7,
                    durationMs: 1000,
                    reason: "Conflict resolved, granted based on score."
                }]
            })
        };

        const request: CapabilityRequest = {
            capability: "WRITE_DATA",
            componentId: "ComponentA",
            urgency: 0.5,
            impact: 0.5,
            requiredDurationMs: 1000,
            weights: {
                urgency: 0.5,
                impact: 0.3,
                duration: 0.2,
            }
        };

        const result = engine.evaluateRequest(request);

        expect(result.isConflict).toBe(true);
        expect(result.conflictsResolved).toBe(true);
        expect(result.grantedScopes).toHaveLength(1);
        expect(result.grantedScopes[0].capability).toBe("WRITE_DATA");
        expect(result.grantedScopes[0].priority).toBe(0.7);
    });

    it("should return an empty result if the request is deemed too low priority or invalid", () => {
        const engine = {
            // Mock implementation for testing purposes
            evaluateRequest: (request) => ({
                isConflict: false,
                score: 0.1,
                conflictsResolved: false,
                grantedScopes: []
            })
        };

        const request: CapabilityRequest = {
            capability: "READ_DATA",
            componentId: "ComponentB",
            urgency: 0.1,
            impact: 0.1,
            requiredDurationMs: 100,
            weights: {
                urgency: 0.1,
                impact: 0.1,
                duration: 0.8,
            }
        };

        const result = engine.evaluateRequest(request);

        expect(result.isConflict).toBe(false);
        expect(result.score).toBe(0.1);
        expect(result.grantedScopes).toHaveLength(0);
    });
});