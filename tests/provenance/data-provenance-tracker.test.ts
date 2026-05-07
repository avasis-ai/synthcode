import { describe, it, expect } from "vitest";
import {
    TransformationDetails,
    TransformationStep,
    ProvenanceMetadata,
} from "../src/provenance/data-provenance-tracker";

describe("ProvenanceMetadata", () => {
    it("should correctly initialize basic metadata", () => {
        const sourceId = "source-123";
        const initialPayloadHash = "abcde12345";
        const sourceTimestamp = Date.now();

        const metadata: ProvenanceMetadata = {
            sourceId,
            initialPayloadHash,
            sourceTimestamp,
            transformationHistory: [],
        };

        expect(metadata.sourceId).toBe(sourceId);
        expect(metadata.initialPayloadHash).toBe(initialPayloadHash);
        expect(metadata.sourceTimestamp).toBe(sourceTimestamp);
        expect(metadata.transformationHistory).toEqual([]);
    });

    it("should add a transformation step to the history", () => {
        const initialMetadata: ProvenanceMetadata = {
            sourceId: "source-123",
            initialPayloadHash: "abcde12345",
            sourceTimestamp: Date.now(),
            transformationHistory: [],
        };

        const newStep: TransformationStep = {
            stepId: "step-456",
            description: "Clean data",
            details: {
                stepId: "step-456",
                toolName: "CleanerTool",
                description: "Clean data",
                inputSchema: {
                    id: "string",
                },
                outputSchema: {
                    cleaned_id: "string",
                },
                timestamp: Date.now(),
            },
        };

        // Assuming a function like addTransformationStep exists or we simulate the update
        const updatedMetadata: ProvenanceMetadata = {
            ...initialMetadata,
            transformationHistory: [newStep],
        };

        expect(updatedMetadata.transformationHistory).toHaveLength(1);
        expect(updatedMetadata.transformationHistory[0].stepId).toBe("step-456");
        expect(updatedMetadata.transformationHistory[0].details.toolName).toBe("CleanerTool");
    });

    it("should handle multiple transformation steps correctly", () => {
        const initialMetadata: ProvenanceMetadata = {
            sourceId: "source-123",
            initialPayloadHash: "abcde12345",
            sourceTimestamp: Date.now(),
            transformationHistory: [],
        };

        const step1: TransformationStep = {
            stepId: "step-1",
            description: "Step One",
            details: {
                stepId: "step-1",
                toolName: "ToolA",
                description: "Step One",
                inputSchema: {},
                outputSchema: {},
                timestamp: 1000,
            },
        };

        const step2: TransformationStep = {
            stepId: "step-2",
            description: "Step Two",
            details: {
                stepId: "step-2",
                toolName: "ToolB",
                description: "Step Two",
                inputSchema: {},
                outputSchema: {},
                timestamp: 2000,
            },
        };

        const updatedMetadata: ProvenanceMetadata = {
            ...initialMetadata,
            transformationHistory: [step1, step2],
        };

        expect(updatedMetadata.transformationHistory).toHaveLength(2);
        expect(updatedMetadata.transformationHistory[0].stepId).toBe("step-1");
        expect(updatedMetadata.transformationHistory[1].stepId).toBe("step-2");
    });
});