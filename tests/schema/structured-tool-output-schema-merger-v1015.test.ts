import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV1015 } from "../src/schema/structured-tool-output-schema-merger-v1015.js";

describe("StructuredToolOutputSchemaMergerV1015", () => {
    const merger = new StructuredToolOutputSchemaMergerV1015();

    it("should merge schemas correctly when weights favor schemaA", () => {
        const schemaA = {
            name: "tool_a",
            description: "A tool",
            properties: {
                input: { type: "string" }
            }
        };
        const schemaB = {
            name: "tool_b",
            description: "Another tool",
            properties: {
                output: { type: "number" }
            }
        };
        const weights = {
            "tool_a": 0.8,
            "tool_b": 0.2
        };

        const merged = merger.mergeWithSourceWeighting(schemaA, schemaB, weights);

        expect(merged.name).toBe("tool_a");
        expect(merged.properties).toHaveProperty("input");
        expect(merged.properties).toHaveProperty("output");
    });

    it("should merge schemas correctly when weights favor schemaB", () => {
        const schemaA = {
            name: "tool_a",
            description: "A tool",
            properties: {
                input: { type: "string" }
            }
        };
        const schemaB = {
            name: "tool_b",
            description: "Another tool",
            properties: {
                output: { type: "number" }
            }
        };
        const weights = {
            "tool_a": 0.2,
            "tool_b": 0.8
        };

        const merged = merger.mergeWithSourceWeighting(schemaA, schemaB, weights);

        expect(merged.name).toBe("tool_b");
        expect(merged.properties).toHaveProperty("input");
        expect(merged.properties).toHaveProperty("output");
    });

    it("should handle missing keys in weights gracefully", () => {
        const schemaA = {
            name: "tool_a",
            properties: {
                input: { type: "string" }
            }
        };
        const schemaB = {
            name: "tool_b",
            properties: {
                output: { type: "number" }
            }
        };
        const weights = {};

        const merged = merger.mergeWithSourceWeighting(schemaA, schemaB, weights);

        expect(merged.name).toBe("tool_a"); // Defaulting to schemaA's value if weights are empty
        expect(merged.properties).toHaveProperty("input");
        expect(merged.properties).toHaveProperty("output");
    });
});