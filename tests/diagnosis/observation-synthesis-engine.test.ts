import { describe, it, expect } from "vitest";
import { ObservationSynthesisEngine } from "../src/diagnosis/observation-synthesis-engine";

describe("ObservationSynthesisEngine", () => {
    it("should correctly synthesize observations from a set of inputs", () => {
        const engine = new ObservationSynthesisEngine();
        const observations = [
            {
                id: "obs-1",
                metricName: "cpu_usage",
                value: 0.8,
                threshold: 0.7,
                isHigh: true,
            },
            {
                id: "obs-2",
                constraintName: "memory_limit",
                violationDetails: "Exceeded allocated memory",
                severity: "HIGH",
            },
            {
                id: "obs-3",
                diffPath: "config.yaml/timeout",
                oldValue: 5000,
                newValue: 10000,
            },
        ];
        const synthesized = engine.synthesize(observations);

        expect(synthesized).toHaveLength(3);
        expect(synthesized[0].type).toBe("MetricObservation");
        expect(synthesized[1].type).toBe("ConstraintViolationObservation");
        expect(synthesized[2].type).toBe("ContextDiffObservation");
    });

    it("should handle an empty list of observations gracefully", () => {
        const engine = new ObservationSynthesisEngine();
        const observations: any[] = [];
        const synthesized = engine.synthesize(observations);

        expect(synthesized).toEqual([]);
    });

    it("should correctly identify and process mixed types of observations", () => {
        const engine = new ObservationSynthesisEngine();
        const observations = [
            {
                id: "obs-A",
                metricName: "latency",
                value: 0.1,
                threshold: 0.2,
                isHigh: false,
            },
            {
                id: "obs-B",
                constraintName: "rate_limit",
                violationDetails: "Too many requests",
                severity: "LOW",
            },
        ];
        const synthesized = engine.synthesize(observations);

        expect(synthesized).toHaveLength(2);
        expect(synthesized[0].type).toBe("MetricObservation");
        expect(synthesized[1].type).toBe("ConstraintViolationObservation");
    });
});