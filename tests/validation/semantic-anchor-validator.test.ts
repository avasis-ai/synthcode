import { describe, it, expect } from "vitest";
import { SemanticAnchorValidator } from "../src/validation/semantic-anchor-validator";
import { SemanticAnchor } from "../src/validation/types";

describe("SemanticAnchorValidator", () => {
    it("should correctly validate a semantic anchor based on cosine similarity", () => {
        // Mock embeddings and distance metric
        const mockAnchor: SemanticAnchor = { id: "anchor", embedding: [1, 0] };
        const mockEmbedding: [number, number] = [1, 0];
        const mockDistanceMetric = (e1: [number, number], e2: [number, number]): number => {
            // Simple cosine similarity approximation for [1, 0] vs [1, 0]
            if (e1[0] === 1 && e2[0] === 1 && e1[1] === 0 && e2[1] === 0) return 1.0;
            return 0.0;
        };
        const threshold = 0.9;

        const validator = new SemanticAnchorValidator(mockAnchor, mockDistanceMetric, threshold);

        // Test case: High similarity (should pass)
        const resultPass = validator.validate(mockEmbedding);
        expect(resultPass).toBe(true);
    });

    it("should fail validation when the semantic distance is too high", () => {
        // Mock embeddings and distance metric
        const mockAnchor: SemanticAnchor = { id: "anchor", embedding: [1, 0] };
        const mockEmbedding: [number, number] = [0, 1]; // Orthogonal to [1, 0]
        const mockDistanceMetric = (e1: [number, number], e2: [number, number]): number => {
            // Simulate low similarity (e.g., cosine similarity of 0)
            return 0.0;
        };
        const threshold = 0.9;

        const validator = new SemanticAnchorValidator(mockAnchor, mockDistanceMetric, threshold);

        // Test case: Low similarity (should fail)
        const resultFail = validator.validate(mockEmbedding);
        expect(resultFail).toBe(false);
    });

    it("should handle edge case where similarity is exactly at the threshold", () => {
        // Mock embeddings and distance metric
        const mockAnchor: SemanticAnchor = { id: "anchor", embedding: [1, 0] };
        const mockEmbedding: [number, number] = [1, 0];
        const mockDistanceMetric = (e1: [number, number], e2: [number, number]): number => {
            // Simulate similarity exactly at the threshold
            return 0.9;
        };
        const threshold = 0.9;

        const validator = new SemanticAnchorValidator(mockAnchor, mockDistanceMetric, threshold);

        // Test case: Similarity equals threshold (should pass)
        const resultPass = validator.validate(mockEmbedding);
        expect(resultPass).toBe(true);
    });
});