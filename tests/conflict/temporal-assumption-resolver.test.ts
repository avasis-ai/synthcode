import { describe, it, expect } from "vitest";
import { TemporalAssumptionResolver } from "../src/conflict/temporal-assumption-resolver";

describe("TemporalAssumptionResolver", () => {
    it("should resolve conflicts when assumptions overlap in time", async () => {
        const resolver = new TemporalAssumptionResolver();
        const assumption: TemporalAssumption = {
            id: "a1",
            subject: "A",
            target: "B",
            relationship: "BEFORE",
            minTimeDeltaMs: 100,
            maxTimeDeltaMs: 200,
            sourceContextId: "ctx1",
        };
        const observation: Observation = {
            eventId: "e1",
            subject: "A",
            target: "B",
            startTimeMs: 1000,
            endTimeMs: 1200,
            source: "source1",
        };

        const result = await resolver.resolveConflict(assumption, observation);

        expect(result).toBeDefined();
        expect(result?.suggestedAction).toBe("ADJUST_WINDOW");
        expect(result?.reason).toContain("overlap");
    });

    it("should not suggest an adjustment if the assumption window is valid", async () => {
        const resolver = new TemporalAssumptionResolver();
        const assumption: TemporalAssumption = {
            id: "a2",
            subject: "C",
            target: "D",
            relationship: "AFTER",
            minTimeDeltaMs: 50,
            maxTimeDeltaMs: 100,
            sourceContextId: "ctx2",
        };
        const observation: Observation = {
            eventId: "e2",
            subject: "C",
            target: "D",
            startTimeMs: 1000,
            endTimeMs: 1100,
            source: "source2",
        };

        // Simulate a case where the observation is clearly after the assumption window
        // (This setup assumes the resolver logic handles the timing correctly)
        const result = await resolver.resolveConflict(assumption, observation);

        expect(result).toBeNull();
    });

    it("should suggest adjustment if the observation is significantly outside the assumption window", async () => {
        const resolver = new TemporalAssumptionResolver();
        const assumption: TemporalAssumption = {
            id: "a3",
            subject: "X",
            target: "Y",
            relationship: "BEFORE",
            minTimeDeltaMs: 500,
            maxTimeDeltaMs: 600,
            sourceContextId: "ctx3",
        };
        const observation: Observation = {
            eventId: "e3",
            subject: "X",
            target: "Y",
            startTimeMs: 100,
            endTimeMs: 200,
            source: "source3",
        };

        const result = await resolver.resolveConflict(assumption, observation);

        expect(result).toBeDefined();
        expect(result?.suggestedAction).toBe("ADJUST_WINDOW");
        expect(result?.reason).toContain("outside window");
    });
});