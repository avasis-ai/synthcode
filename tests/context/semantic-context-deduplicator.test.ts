import { describe, it, expect } from "vitest";
import { deduplicateSemanticContext } from "../src/context/semantic-context-deduplicator";

describe("deduplicateSemanticContext", () => {
    it("should return the same context if no duplicates are present", () => {
        const context = [
            { role: "user", content: "Hello" },
            { role: "assistant", content: ["Hi there"] },
            { role: "user", content: "How are you?" },
        ];
        const result = deduplicateSemanticContext(context);
        expect(result).toEqual(context);
    });

    it("should remove duplicate consecutive user messages", () => {
        const context = [
            { role: "user", content: "First message" },
            { role: "user", content: "First message" },
            { role: "assistant", content: ["Response"] },
            { role: "user", content: "Second message" },
            { role: "user", content: "Second message" },
        ];
        const result = deduplicateSemanticContext(context);
        expect(result).toEqual([
            { role: "user", content: "First message" },
            { role: "assistant", content: ["Response"] },
            { role: "user", content: "Second message" },
        ]);
    });

    it("should handle mixed roles and remove duplicates correctly", () => {
        const context = [
            { role: "user", content: "A" },
            { role: "assistant", content: ["B"] },
            { role: "user", content: "A" },
            { role: "user", content: "A" },
            { role: "assistant", content: ["B"] },
        ];
        const result = deduplicateSemanticContext(context);
        expect(result).toEqual([
            { role: "user", content: "A" },
            { role: "assistant", content: ["B"] },
            { role: "user", content: "A" },
            { role: "assistant", content: ["B"] },
        ]);
    });
});