import { describe, it, expect } from "vitest";
import { KnowledgeGapFiller } from "../src/knowledge/knowledge-gap-filler.js";

describe("KnowledgeGapFiller", () => {
    it("should detect knowledge gaps when context is insufficient for the goal", async () => {
        const filler = new KnowledgeGapFiller();
        const context = {
            history: [{ role: "user", content: "What is the capital of France?" }],
            state: { user_id: "user123" },
            // Simulate missing detailed knowledge
        };
        const goal = {
            task: "Answer the question about France's capital.",
            required_knowledge: ["Geography", "European Capitals"],
        };

        const result = filler.detectGaps(context, goal);

        expect(result).not.toBeNull();
        expect(result!.gaps).toContain("European Capitals");
        expect(result!.requiredTopics).toEqual(["Geography", "European Capitals"]);
    });

    it("should detect no knowledge gaps when context is rich and goal is clear", async () => {
        const filler = new KnowledgeGapFiller();
        const context = {
            history: [{ role: "user", content: "The capital of France is Paris." }],
            state: { user_id: "user123", knowledge_level: "advanced" },
            // Simulate rich context
        };
        const goal = {
            task: "Confirm the capital of France.",
            required_knowledge: ["Geography"],
        };

        const result = filler.detectGaps(context, goal);

        expect(result).not.toBeNull();
        expect(result!.gaps).toEqual([]);
        expect(result!.requiredTopics).toEqual(["Geography"]);
    });

    it("should handle empty context and goal gracefully", async () => {
        const filler = new KnowledgeGapFiller();
        const context = {
            history: [],
            state: {},
        };
        const goal = {
            task: "General inquiry",
            required_knowledge: [],
        };

        const result = filler.detectGaps(context, goal);

        expect(result).not.toBeNull();
        expect(result!.gaps).toEqual([]);
        expect(result!.requiredTopics).toEqual([]);
    });
});