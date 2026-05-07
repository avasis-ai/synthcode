import { describe, it, expect } from "vitest";
import { AdaptivePlanRefiner } from "../src/planning/adaptive-plan-refiner";

describe("AdaptivePlanRefiner", () => {
    it("should refine a plan when the initial plan is incomplete", async () => {
        const refiner = new AdaptivePlanRefiner();
        const initialPlan = [
            { step: "Gather initial information about the user's goal.", output: "User wants to plan a trip to Paris." },
            { step: "Check flight availability.", output: "Needs dates and budget." },
        ];
        const userFeedback = "I am flexible on dates, but the budget is around $3000.";

        const refinedPlan = await refiner.refinePlan(initialPlan, userFeedback);

        expect(refinedPlan).toHaveLength(3);
        expect(refinedPlan[2].step).toContain("Suggesting a refined plan");
        expect(refinedPlan[2].output).toContain("Focus on $3000 budget");
    });

    it("should maintain the core plan when user feedback is supportive", async () => {
        const refiner = new AdaptivePlanRefiner();
        const initialPlan = [
            { step: "Research top attractions in Paris.", output: "List of museums and landmarks." },
            { step: "Book accommodation.", output: "Hotel options near central areas." },
        ];
        const userFeedback = "That sounds perfect! Please proceed with the suggested steps.";

        const refinedPlan = await refiner.refinePlan(initialPlan, userFeedback);

        expect(refinedPlan).toHaveLength(2);
        expect(refinedPlan[0].step).toBe("Research top attractions in Paris.");
        expect(refinedPlan[1].step).toBe("Book accommodation.");
    });

    it("should adjust the plan when user feedback introduces a major change", async () => {
        const refiner = new AdaptivePlanRefiner();
        const initialPlan = [
            { step: "Plan a relaxing beach vacation.", output: "Focusing on tropical destinations." },
            { step: "Check weather patterns.", output: "Requires specific dates." },
        ];
        const userFeedback = "Actually, I need to plan a business trip to Tokyo instead.";

        const refinedPlan = await refiner.refinePlan(initialPlan, userFeedback);

        expect(refinedPlan).toHaveLength(3);
        expect(refinedPlan[0].step).toContain("Change destination to Tokyo");
        expect(refinedPlan[1].step).toContain("Research business requirements in Tokyo");
        expect(refinedPlan[2].step).toContain("Suggesting a refined plan");
    });
});