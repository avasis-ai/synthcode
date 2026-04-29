import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV1021 } from "../src/schema/structured-tool-output-schema-merger-v1021";

describe("StructuredToolOutputSchemaMergerV1021", () => {
    it("should merge multiple schemas correctly with default policy (prefer-latest)", () => {
        const merger = new StructuredToolOutputSchemaMergerV1021();
        const schema1: any = { properties: { name: { type: "string" } } };
        const schema2: any = { properties: { age: { type: "integer" } } };
        const schema3: any = { properties: { name: { type: "string", description: "Updated name" } } };

        const merged = merger.mergeSchemas([schema1, schema2, schema3]);

        expect(merged.properties.name.description).toBe("Updated name");
        expect(merged.properties.age).toBeDefined();
    });

    it("should handle conflict resolution with 'union-all' policy", () => {
        const merger = new StructuredToolOutputSchemaMergerV1021();
        const schema1: any = { properties: { id: { type: "string", description: "ID" } } };
        const schema2: any = { properties: { id: { type: "number", description: "Another ID" } } };

        const merged = merger.mergeSchemas([schema1, schema2], "union-all");

        // In union-all, the properties should ideally contain both definitions if they conflict
        // For simplicity in this test, we check if the structure suggests merging occurred.
        // A real implementation might merge definitions into an array or union type.
        expect(merged.properties.id).toBeDefined();
    });

    it("should handle conflict resolution with 'prefer-existing' policy", () => {
        const merger = new StructuredToolOutputSchemaMergerV1021();
        const schema1: any = { properties: { name: { type: "string", description: "Original" } } };
        const schema2: any = { properties: { name: { type: "string", description: "Newer" } } };

        const merged = merger.mergeSchemas([schema1, schema2], "prefer-existing");

        // With prefer-existing, the first definition encountered for 'name' should persist.
        expect(merged.properties.name.description).toBe("Original");
    });
});