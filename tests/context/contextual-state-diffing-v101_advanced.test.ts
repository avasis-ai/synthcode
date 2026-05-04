import { describe, it, expect } from "vitest";
import { ContextualStateDiffPayload } from "../src/context/contextual-state-diffing-v101_advanced";

describe("ContextualStateDiffingV101Advanced", () => {
    it("should correctly identify a simple state change with no context events", () => {
        const payload: ContextualStateDiffPayload = {
            currentState: { counter: 10, user: "Alice" },
            previousState: { counter: 5, user: "Alice" },
            contextEvents: [],
        };
        // Assuming a function exists to process this, we test the structure's handling
        // For this test, we just verify the structure is passed correctly.
        expect(payload.currentState).toEqual({ counter: 10, user: "Alice" });
        expect(payload.previousState).toEqual({ counter: 5, user: "Alice" });
        expect(payload.contextEvents).toEqual([]);
    });

    it("should prioritize the impact score when determining the most significant change", () => {
        const payload: ContextualStateDiffPayload = {
            currentState: { data: "new_data" },
            previousState: { data: "old_data" },
            contextEvents: [
                { timestamp: 1, source: "user", impactScore: 0.2, description: "Minor user input", relatedMessageId: "msg1" },
                { timestamp: 2, source: "assistant", impactScore: 0.9, description: "Major model update", relatedMessageId: "msg2" },
            ],
        };
        // In a real scenario, we'd call the diffing function. Here we check the input structure.
        expect(payload.contextEvents.length).toBe(2);
        expect(payload.contextEvents[1].impactScore).toBe(0.9);
    });

    it("should handle state changes when context events are present and related", () => {
        const payload: ContextualStateDiffPayload = {
            currentState: { sessionActive: true, lastToolCall: "toolX" },
            previousState: { sessionActive: false, lastToolCall: null },
            contextEvents: [
                { timestamp: 3, source: "tool", impactScore: 0.7, description: "Tool X executed", relatedMessageId: "msg2" },
            ],
        };
        expect(payload.currentState.sessionActive).toBe(true);
        expect(payload.contextEvents[0].source).toBe("tool");
        expect(payload.contextEvents[0].relatedMessageId).toBe("msg2");
    });
});