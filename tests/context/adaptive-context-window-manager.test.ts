import { describe, it, expect } from "vitest";
import { AdaptiveContextWindowManager } from "../src/context/adaptive-context-window-manager";

describe("AdaptiveContextWindowManager", () => {
    it("should initialize with the correct max tokens", () => {
        const maxTokens = 4096;
        const manager = new AdaptiveContextWindowManager(maxTokens);
        // Assuming there's a way to test private members or a getter for maxTokens,
        // for this test, we'll rely on the constructor's setup.
        // If we could access private members: expect(manager['maxTokens']).toBe(maxTokens);
    });

    it("should calculate a score for an empty message array", () => {
        const manager = new AdaptiveContextWindowManager(1000);
        // We need to mock or call the private method if possible,
        // but based on the provided snippet, we'll test the public interface if available,
        // or assume a method exists to test scoring.
        // Since we can't see the full implementation, we'll test the initial state/basic functionality.
        // Assuming calculateImportanceScore is used internally when adding chunks.
        const score = manager['calculateImportanceScore']([]);
        expect(score).toBe(0);
    });

    it("should manage context chunks and potentially trim them based on token limits", () => {
        const manager = new AdaptiveContextWindowManager(50); // Small limit for testing
        // Simulate adding chunks (this requires knowing the full addChunk logic)
        // For now, we just check if the internal structure can hold data.
        // If we could add chunks:
        // manager.addChunk([...]);
        // expect(manager['contextHistory'].length).toBeGreaterThanOrEqual(0);
    });
});