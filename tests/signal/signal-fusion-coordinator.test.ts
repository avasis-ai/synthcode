import { describe, it, expect, vi } from "vitest";
import { SignalFusionCoordinator } from "../src/signal/signal-fusion-coordinator.js";

describe("SignalFusionCoordinator", () => {
    it("should initialize correctly and process a single signal", () => {
        const coordinator = new SignalFusionCoordinator();
        const signal: SignalInput = {
            signalType: "latency",
            source: "NetworkA",
            severity: 5,
            payload: { latencyMs: 150 }
        };
        coordinator.processSignal(signal);

        const state = coordinator.getCurrentState();
        expect(state.sources.has("NetworkA")).toBe(true);
        expect(state.totalSeverity).toBe(5);
        expect(state.averageSeverity).toBe(5);
        expect(state.payloads["NetworkA"]).toEqual({ latencyMs: 150 });
    });

    it("should correctly aggregate multiple signals of the same type", () => {
        const coordinator = new SignalFusionCoordinator();
        const signal1: SignalInput = {
            signalType: "trust",
            source: "ServiceX",
            severity: 3,
            payload: { reason: "low confidence" }
        };
        const signal2: SignalInput = {
            signalType: "trust",
            source: "ServiceY",
            severity: 7,
            payload: { reason: "high risk" }
        };

        coordinator.processSignal(signal1);
        coordinator.processSignal(signal2);

        const state = coordinator.getCurrentState();
        expect(state.sources.size).toBe(2);
        expect(state.totalSeverity).toBe(10);
        expect(state.averageSeverity).toBe(5);
        expect(state.payloads["ServiceX"]).toEqual({ reason: "low confidence" });
        expect(state.payloads["ServiceY"]).toEqual({ reason: "high risk" });
    });

    it("should update system state based on aggregated severity", () => {
        const coordinator = new SignalFusionCoordinator();
        // Low severity signals
        coordinator.processSignal({
            signalType: "general",
            source: "A",
            severity: 1,
            payload: {}
        });
        // High severity signal
        coordinator.processSignal({
            signalType: "resource",
            source: "B",
            severity: 9,
            payload: {}
        });

        const state = coordinator.getCurrentState();
        expect(state.totalSeverity).toBe(10);
        expect(state.averageSeverity).toBe(5);
        expect(state.isCritical).toBe(true); // Assuming a threshold for criticality
        expect(state.overallScore).toBeGreaterThan(5);
    });
});