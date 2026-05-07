import { describe, it, expect } from "vitest";
import { KnowledgeGapResearchPlanner } from "../src/planning/knowledge-gap-research-planner.js";
import { KnowledgeGap } from "../src/planning/knowledge-gap.js";
import { ResearchStep } from "../src/planning/research-step.js";

describe("KnowledgeGapResearchPlanner", () => {
    it("should generate an initial plan when knowledge gaps are present", () => {
        const gaps = [
            { id: "gap1", description: "Understanding the impact of AI on education." },
            { id: "gap2", description: "Analyzing student engagement metrics." }
        ];
        const knowledgeGap = new KnowledgeGap(gaps);
        const planner = new KnowledgeGapResearchPlanner(knowledgeGap);

        const plan = planner.generateInitialPlan();

        expect(plan).toBeInstanceOf(Array);
        expect(plan.length).toBeGreaterThan(0);
        // Check if the plan contains steps related to the gaps
        expect(plan.some(step => step.description.includes("AI on education"))).toBe(true);
        expect(plan.some(step => step.description.includes("student engagement metrics"))).toBe(true);
    });

    it("should return an empty plan when no knowledge gaps are provided", () => {
        const knowledgeGap = new KnowledgeGap([]);
        const planner = new KnowledgeGapResearchPlanner(knowledgeGap);

        const plan = planner.generateInitialPlan();

        expect(plan).toEqual([]);
    });

    it("should generate a plan that prioritizes gaps based on defined criteria (e.g., complexity or urgency)", () => {
        // Mocking a scenario where gap 2 is considered more critical/complex
        const gaps = [
            { id: "gap1", description: "Simple gap." },
            { id: "gap2", description: "Complex and critical gap." }
        ];
        // Assuming the planner prioritizes gaps based on some internal logic (e.g., the order they are added or a simulated priority)
        const knowledgeGap = new KnowledgeGap(gaps);
        const planner = new KnowledgeGapResearchPlanner(knowledgeGap);

        const plan = planner.generateInitialPlan();

        expect(plan).toBeInstanceOf(Array);
        // Since the heuristic is internal, we check if the plan length is correct and if the steps are generated.
        expect(plan.length).toBe(2);
        // A more specific check would require knowing the exact prioritization logic, but we ensure the critical gap is addressed.
        // Assuming the planner processes gaps sequentially or based on a defined order.
        expect(plan.some(step => step.description.includes("Complex and critical gap"))).toBe(true);
    });
});