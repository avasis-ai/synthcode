import { describe, it, expect } from "vitest";
import { ConflictResolver } from "../src/conflict/contextual-constraint-conflict-resolver";
import { Conflict } from "../src/conflict/types";

describe("ConflictResolver", () => {
    it("should resolve a resource overlap conflict correctly", async () => {
        const resolver = new ConflictResolver();
        const conflict: Conflict = {
            constraintId1: "res1",
            constraintId2: "res2",
            type: "resource_overlap",
        };
        const result = await resolver.resolve(conflict, {
            payload: { resource: "A", start: 1, end: 5 },
            history: [],
        });
        expect(result).toBe("Conflict resolved: Resource A overlaps between 1 and 5.");
    });

    it("should resolve a temporal contradiction conflict correctly", async () => {
        const resolver = new ConflictResolver();
        const conflict: Conflict = {
            constraintId1: "time1",
            constraintId2: "time2",
            type: "temporal_contradiction",
        };
        const result = await resolver.resolve(conflict, {
            payload: { event: "Meeting", start: 10, end: 20 },
            history: [],
        });
        expect(result).toBe("Conflict resolved: Event Meeting is scheduled from 10 to 20.");
    });

    it("should handle conflicts when history suggests a resolution", async () => {
        const resolver = new ConflictResolver();
        const conflict: Conflict = {
            constraintId1: "res1",
            constraintId2: "res2",
            type: "resource_overlap",
        };
        const history: Message[] = [
            { role: "user", content: "Book resource A for 1-5." },
            { role: "assistant", content: "Confirmed. Resource A booked for 1-5." },
        ];
        const context = {
            payload: { resource: "A", start: 1, end: 5 },
            history: history,
        };
        const result = await resolver.resolve(conflict, context);
        expect(result).toContain("Resource A is already booked");
    });
});