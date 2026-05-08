import { describe, it, expect } from "vitest";
import { ObservationFilterRule, Observation, Context } from "../src/filtering/observation-focus-filter";

describe("ObservationFocusFilter", () => {
    it("should return true for a matching event observation", () => {
        const rule: ObservationFilterRule = {
            description: "Filter for specific event type",
            keywords: ["event"],
            filter: (observation: Observation, context: Context): boolean => {
                if (typeof observation === "object" && observation !== null && "type" in observation && observation.type === "event") {
                    const data = observation.data as Record<string, unknown>;
                    return data.hasOwnProperty("focus_area") && data.focus_area === "user_interaction";
                }
                return false;
            },
        };

        const context: Context = {
            session_id: "test-session",
            history: [],
            current_state: {},
        };

        const observation: Observation = {
            type: "event",
            data: { focus_area: "user_interaction", source: "ui" },
        };

        expect(rule.filter(observation, context)).toBe(true);
    });

    it("should return false for a non-matching message observation", () => {
        const rule: ObservationFilterRule = {
            description: "Filter for specific event type",
            keywords: ["event"],
            filter: (observation: Observation, context: Context): boolean => {
                if (typeof observation === "object" && observation !== null && "type" in observation && observation.type === "event") {
                    const data = observation.data as Record<string, unknown>;
                    return data.hasOwnProperty("focus_area") && data.focus_area === "user_interaction";
                }
                return false;
            },
        };

        const context: Context = {
            session_id: "test-session",
            history: [],
            current_state: {},
        };

        const observation: Observation = {
            type: "ThinkingBlock",
            content: "Some thinking process.",
        } as Observation;

        expect(rule.filter(observation, context)).toBe(false);
    });

    it("should return false for an event observation with incorrect focus_area", () => {
        const rule: ObservationFilterRule = {
            description: "Filter for specific event type",
            keywords: ["event"],
            filter: (observation: Observation, context: Context): boolean => {
                if (typeof observation === "object" && observation !== null && "type" in observation && observation.type === "event") {
                    const data = observation.data as Record<string, unknown>;
                    return data.hasOwnProperty("focus_area") && data.focus_area === "user_interaction";
                }
                return false;
            },
        };

        const context: Context = {
            session_id: "test-session",
            history: [],
            current_state: {},
        };

        const observation: Observation = {
            type: "event",
            data: { focus_area: "system_update", source: "backend" },
        };

        expect(rule.filter(observation, context)).toBe(false);
    });
});