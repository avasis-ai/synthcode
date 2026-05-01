import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v18";

describe("ContextualStateDiffer", () => {
    it("should correctly identify structural changes when content is added", () => {
        const differ = new ContextualStateDiffer();
        const oldState = {
            blocks: [
                { type: "text", content: "Hello" }
            ]
        };
        const newState = {
            blocks: [
                { type: "text", content: "Hello" },
                { type: "tool_use", toolName: "search" }
            ]
        };

        const diff = differ.diff(oldState, newState);
        expect(diff.structuralChanges.length).toBeGreaterThanOrEqual(1);
        expect(diff.structuralChanges).toEqual(expect.arrayContaining([
            expect.objectContaining({
                path: "blocks[1]",
                changeType: "added",
            })
        ]));
    });

    it("should correctly identify structural changes when content is modified", () => {
        const differ = new ContextualStateDiffer();
        const oldState = {
            blocks: [
                { type: "text", content: "Old content" }
            ]
        };
        const newState = {
            blocks: [
                { type: "text", content: "New content" }
            ]
        };

        const diff = differ.diff(oldState, newState);
        expect(diff.structuralChanges.length).toBeGreaterThanOrEqual(1);
        expect(diff.structuralChanges).toEqual(expect.arrayContaining([
            expect.objectContaining({
                path: "blocks[0].content",
                changeType: "modified",
            })
        ]));
    });

    it("should detect semantic drift when content changes significantly", () => {
        const differ = new ContextualStateDiffer();
        const oldState = {
            blocks: [
                { type: "text", content: "The cat sat on the mat." }
            ]
        };
        const newState = {
            blocks: [
                { type: "text", content: "The quantum entanglement field collapsed." }
            ]
        };

        const diff = differ.diff(oldState, newState);
        expect(diff.semanticDiff.conceptDriftDetected).toBe(true);
        expect(diff.semanticDiff.semanticDriftScore).toBeGreaterThan(0.5);
    });
});