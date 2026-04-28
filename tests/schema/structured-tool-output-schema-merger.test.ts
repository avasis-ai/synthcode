import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger";

describe("StructuredToolOutputSchemaMerger", () => {
    it("should throw an error if no schemas are provided", () => {
        expect(() => new StructuredToolOutputSchemaMerger([])).toThrow("Schema definitions array cannot be empty.");
    });

    it("should correctly merge multiple simple schemas", () => {
        const schema1 = { type: "object", properties: { id: { type: "string" } } };
        const schema2 = { type: "object", properties: { name: { type: "string" } } };
        const merger = new StructuredToolOutputSchemaMerger([schema1, schema2]);

        const mergedSchema = merger.merge();

        expect(mergedSchema).toHaveProperty("type", "object");
        expect(mergedSchema).toHaveProperty("properties");
        expect(mergedSchema.properties).toEqual({
            id: { type: "string" },
            name: { type: "string" },
        });
    });

    it("should overwrite properties when merging schemas with the same property name", () => {
        const schema1 = { type: "object", properties: { common: { type: "string", description: "First" } } };
        const schema2 = { type: "object", properties: { common: { type: "number", description: "Second" } } };
        const merger = new StructuredToolOutputSchemaMerger([schema1, schema2]);

        const mergedSchema = merger.merge();

        expect(mergedSchema).toHaveProperty("properties");
        expect(mergedSchema.properties).toEqual({
            common: { type: "number", description: "Second" },
        });
    });
});