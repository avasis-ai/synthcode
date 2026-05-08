import { describe, it, expect } from "vitest";
import { GoalPathValidator } from "../src/validation/goal-path-validator";

describe("GoalPathValidator", () => {
    it("should correctly validate a simple path with all required components present", () => {
        const goal: Goal = {
            description: "Plan a trip to Paris",
            requiredComponents: ["flight", "hotel", "activity"],
        };
        const context: PlanContext = {
            history: [],
            currentState: {
                flight: true,
                hotel: true,
                activity: true,
            },
        };

        const validator = new GoalPathValidator(goal, context);
        expect(validator.isValid()).toBe(true);
    });

    it("should return false if any required component is missing from the current state", () => {
        const goal: Goal = {
            description: "Plan a trip to Paris",
            requiredComponents: ["flight", "hotel", "activity"],
        };
        const context: PlanContext = {
            history: [],
            currentState: {
                flight: true,
                hotel: true,
                // activity is missing
            },
        };

        const validator = new GoalPathValidator(goal, context);
        expect(validator.isValid()).toBe(false);
    });

    it("should handle goals with no required components gracefully", () => {
        const goal: Goal = {
            description: "General planning",
            requiredComponents: [],
        };
        const context: PlanContext = {
            history: [],
            currentState: {},
        };

        const validator = new GoalPathValidator(goal, context);
        expect(validator.isValid()).toBe(true);
    });
});