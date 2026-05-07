import { describe, it, expect } from "vitest";
import { ObservationFusionEngine, Observation } from "../src/fusion/observation-fusion-engine.js";

describe("ObservationFusionEngine", () => {
    it("should correctly fuse multiple observations with varying data and authorities", () => {
        const engine = new ObservationFusionEngine();
        const obs1: Observation = {
            timestamp: 100,
            sourceAuthority: 1,
            confidenceScore: 0.8,
            data: { temperature: 25, location: "A" },
        };
        const obs2: Observation = {
            timestamp: 101,
            sourceAuthority: 2,
            confidenceScore: 0.9,
            data: { temperature: 26, location: "B" },
        };
        const obs3: Observation = {
            timestamp: 100,
            sourceAuthority: 3,
            confidenceScore: 0.7,
            data: { location: "A" },
        };

        const fused = engine.fuseObservations([obs1, obs2, obs3]);

        expect(fused).toBeDefined();
        expect(fused!.sourceCount).toBe(3);
        // Check if the fused data correctly merges and prioritizes data
        expect(fused!.fusedData).toEqual({
            temperature: 26, // Assuming the engine takes the highest confidence/latest value for overlapping keys
            location: "A",
        });
        // Check if the fused authority and confidence are calculated (e.g., weighted average or max)
        expect(fused!.fusedAuthority).toBeGreaterThanOrEqual(3);
        expect(fused!.fusedConfidence).toBeCloseTo((0.8 + 0.9 + 0.7) / 3);
    });

    it("should handle an empty array of observations gracefully", () => {
        const engine = new ObservationFusionEngine();
        const fused = engine.fuseObservations([]);

        expect(fused).toBeNull();
    });

    it("should return a single observation if only one is provided", () => {
        const engine = new ObservationFusionEngine();
        const obs: Observation = {
            timestamp: 150,
            sourceAuthority: 5,
            confidenceScore: 0.95,
            data: { pressure: 1012 },
        };

        const fused = engine.fuseObservations([obs]);

        expect(fused).toBeDefined();
        expect(fused!.sourceCount).toBe(1);
        expect(fused!.fusedData).toEqual(obs.data);
        expect(fused!.fusedAuthority).toBe(obs.sourceAuthority);
        expect(fused!.fusedConfidence).toBe(obs.confidenceScore);
    });
});