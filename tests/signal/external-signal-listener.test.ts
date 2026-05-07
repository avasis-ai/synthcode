import { describe, it, expect } from "vitest";
import { ExternalSignal, SignalRule } from "../src/signal/external-signal-listener";

describe("ExternalSignalListener", () => {
    it("should correctly identify a signal matching a simple rule", () => {
        const rule: SignalRule = {
            id: "rule-1",
            description: "High severity signal from specific source",
            predicate: (signal: ExternalSignal) => signal.source === "critical-system" && signal.payload.severity === "HIGH",
        };

        const matchingSignal: ExternalSignal = {
            source: "critical-system",
            timestamp: Date.now(),
            payload: { severity: "HIGH", message: "System failure" },
        };

        const results = rule.predicate(matchingSignal);
        expect(results).toBe(true);
    });

    it("should return false for a signal that does not meet the rule criteria", () => {
        const rule: SignalRule = {
            id: "rule-2",
            description: "Signal must come from 'auth-service' and have a payload property 'user_id'",
            predicate: (signal: ExternalSignal) => signal.source === "auth-service" && typeof signal.payload.user_id !== "undefined",
        };

        const nonMatchingSignal: ExternalSignal = {
            source: "logging-service",
            timestamp: Date.now(),
            payload: { message: "Info log" },
        };

        const results = rule.predicate(nonMatchingSignal);
        expect(results).toBe(false);
    });

    it("should handle signals with complex nested payload structures", () => {
        const rule: SignalRule = {
            id: "rule-3",
            description: "Signal must indicate a specific nested condition",
            predicate: (signal: ExternalSignal) => {
                const payload = signal.payload as { details: { status: string } };
                return payload && payload.details && payload.details.status === "ERROR";
            },
        };

        const matchingSignal: ExternalSignal = {
            source: "api-gateway",
            timestamp: Date.now(),
            payload: { details: { status: "ERROR", code: 500 } },
        };

        const nonMatchingSignal: ExternalSignal = {
            source: "api-gateway",
            timestamp: Date.now(),
            payload: { details: { status: "OK" } },
        };

        expect(rule.predicate(matchingSignal)).toBe(true);
        expect(rule.predicate(nonMatchingSignal)).toBe(false);
    });
});