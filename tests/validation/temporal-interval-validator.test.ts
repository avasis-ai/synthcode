import { describe, it, expect } from "vitest";
import { validateIntervals } from "../src/validation/temporal-interval-validator";

describe("validateIntervals", () => {
    it("should return isValid: true for non-overlapping and resource-compliant intervals", async () => {
        const intervals = [
            { id: "A", start: 10, end: 20, duration: 10, required_resources: { "CPU": 1 } },
            { id: "B", start: 20, end: 30, duration: 10, required_resources: { "CPU": 1 } },
        ];
        const result = await validateIntervals(intervals);
        expect(result.isValid).toBe(true);
    });

    it("should detect overlap conflicts between intervals", async () => {
        const intervals = [
            { id: "A", start: 10, end: 20, duration: 10, required_resources: { "CPU": 1 } },
            { id: "B", start: 15, end: 25, duration: 10, required_resources: { "CPU": 1 } }, // Overlaps A
        ];
        const result = await validateIntervals(intervals);
        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].conflictType).toBe("Overlap");
    });

    it("should detect resource overcommitment conflicts", async () => {
        const intervals = [
            { id: "A", start: 10, end: 20, duration: 10, required_resources: { "CPU": 1 } },
            { id: "B", start: 10, end: 20, duration: 10, required_resources: { "CPU": 1 } },
            { id: "C", start: 10, end: 20, duration: 10, required_resources: { "CPU": 1 } }, // Overcommits CPU
        ];
        const result = await validateIntervals(intervals);
        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].conflictType).toBe("ResourceOvercommitment");
    });
});