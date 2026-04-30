import { describe, it, expect } from "vitest";
import { ConstraintPayload } from "../context/contextual-constraint-propagator-v6";

describe("ConstraintPayload", () => {
    it("should correctly initialize with null temporal constraint and empty arrays", () => {
        const payload: ConstraintPayload = {
            temporal: null,
            resources: [],
            capabilities: [],
        };
        expect(payload.temporal).toBeNull();
        expect(payload.resources).toEqual([]);
        expect(payload.capabilities).toEqual([]);
    });

    it("should correctly set a temporal constraint", () => {
        const startTime = 1672531200000;
        const endTime = 1672617600000;
        const payload: ConstraintPayload = {
            temporal: { startTime: startTime, endTime: endTime },
            resources: [],
            capabilities: [],
        };
        expect(payload.temporal).toEqual({ startTime: startTime, endTime: endTime });
    });

    it("should correctly set multiple resource and capability constraints", () => {
        const payload: ConstraintPayload = {
            temporal: null,
            resources: [
                { resourceName: "api_key", limit: 5 },
                { resourceName: "database", limit: 1 },
            ],
            capabilities: [
                { capabilityName: "search", required: true },
                { capabilityName: "image_generation", required: false },
            ],
        };
        expect(payload.resources).toHaveLength(2);
        expect(payload.resources).toContainEqual({ resourceName: "api_key", limit: 5 });
        expect(payload.capabilities).toHaveLength(2);
        expect(payload.capabilities).toContainEqual({ capabilityName: "search", required: true });
    });
});