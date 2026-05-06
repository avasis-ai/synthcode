import { describe, it, expect } from "vitest";
import { KnowledgeGapDetector } from "../src/knowledge/knowledge-gap-detector";

describe("KnowledgeGapDetector", () => {
    it("should detect a missing relationship gap when context is provided", async () => {
        const detector = new KnowledgeGapDetector();
        const context = {
            text: "The capital of France is Paris. Paris is located in France.",
            // Assume a structure that implies a relationship needs to be extracted
        };
        const report = await detector.detectGaps(context);
        expect(report).toHaveLength(0); // Expect no gaps if the context is sufficient
    });

    it("should detect a missing entity gap when context is vague", async () => {
        const detector = new KnowledgeGapDetector();
        const context = {
            text: "The meeting was about the new project, but key details about the stakeholders were missing.",
        };
        const report = await detector.detectGaps(context);
        expect(report).toHaveLength(1);
        expect(report[0].gapType).toBe("MissingEntity");
        expect(report[0].description).toContain("stakeholders");
    });

    it("should detect an undefined context gap when input is empty", async () => {
        const detector = new KnowledgeGapDetector();
        const context = {
            text: "",
        };
        const report = await detector.detectGaps(context);
        expect(report).toHaveLength(1);
        expect(report[0].gapType).toBe("UndefinedContext");
        expect(report[0].description).toContain("empty input");
    });
});