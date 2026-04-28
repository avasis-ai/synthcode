import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV14 } from "../src/schema/structured-tool-output-schema-merger-v14";
import { Schema } from "../src/schema/schema";

describe("StructuredToolOutputSchemaMergerV14", () => {
    it("should throw an error if the schemas array is empty", () => {
        const merger = new StructuredToolOutputSchemaMergerV14();
        const context: Record<string, unknown> = {};
        expect(() => merger.mergeWithContextualResolution([], context)).toThrow("Schema array cannot be empty.");
    });

    it("should correctly merge two schemas with no overlapping properties", () => {
        const merger = new StructuredToolOutputSchemaMergerV14();
        const context: Record<string, unknown> = {};

        const schema1: Schema = { type: "object", properties: { a: { type: "string" } } };
        const schema2: Schema = { type: "object", properties: { b: { type: "number" } } };

        const mergedSchema = merger.mergeWithContextualResolution([schema1, schema2], context);

        expect(mergedSchema.type).toBe("object");
        expect(mergedSchema.properties).toHaveProperty("a");
        expect(mergedSchema.properties).toHaveProperty("b");
    });

    it("should handle merging with context when properties are present", () => {
        const merger = new StructuredToolOutputSchemaMergerV14();
        const context: Record<string, unknown> = { userId: "user123" };

        const schema1: Schema = { type: "object", properties: { id: { type: "string" } } };
        const schema2: Schema = { type: "object", properties: { email: { type: "string" } } };

        const mergedSchema = merger.mergeWithContextualResolution([schema1, schema2], context);

        expect(mergedSchema.type).toBe("object");
        expect(mergedSchema.properties).toHaveProperty("id");
        expect(mergedSchema.properties).toHaveProperty("email");
    });
});