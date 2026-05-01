import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1029";
import { Schema, MergeStrategy } from "../src/schema/types";

describe("SchemaMerger", () => {
    it("should merge two simple schemas with the 'overwrite' strategy", () => {
        const schema1: Schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
        };
        const schema2: Schema = {
            type: "object",
            properties: {
                age: { type: "boolean" }, // Conflict, but overwrite should take schema2's type
                email: { type: "string" },
            },
        };

        const merger = new SchemaMerger([schema1, schema2], "overwrite");
        const result = merger.merge();

        expect(result.mergedSchema.properties).toHaveProperty("name", { type: "string" });
        expect(result.mergedSchema.properties).toHaveProperty("age", { type: "boolean" }); // Overwritten
        expect(result.mergedSchema.properties).toHaveProperty("email", { type: "string" });
        expect(result.conflicts).toEqual({});
    });

    it("should handle conflicts using the 'prefer_first' strategy", () => {
        const schema1: Schema = {
            type: "object",
            properties: {
                id: { type: "string" },
                status: { type: "string" },
            },
        };
        const schema2: Schema = {
            type: "object",
            properties: {
                id: { type: "number" }, // Conflict
                status: { type: "boolean" }, // Conflict
            },
        };

        const merger = new SchemaMerger([schema1, schema2], "prefer_first");
        const result = merger.merge();

        expect(result.mergedSchema.properties).toHaveProperty("id", { type: "string" }); // Should keep schema1's type
        expect(result.mergedSchema.properties).toHaveProperty("status", { type: "string" }); // Should keep schema1's type
        expect(result.conflicts).toEqual({
            "id": {
                conflictingValues: [{ schema: schema1, value: { type: "string" } }, { schema: schema2, value: { type: "number" } }],
                resolution: "prefer_first"
            },
            "status": {
                conflictingValues: [{ schema: schema1, value: { type: "string" } }, { schema: schema2, value: { type: "boolean" } }],
                resolution: "prefer_first"
            }
        });
    });

    it("should merge multiple schemas correctly with 'prefer_last' strategy", () => {
        const schema1: Schema = {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" },
            },
        };
        const schema2: Schema = {
            type: "object",
            properties: {
                b: { type: "boolean" }, // Conflict
                c: { type: "string" },
            },
        };
        const schema3: Schema = {
            type: "object",
            properties: {
                a: { type: "object" }, // Conflict
                d: { type: "boolean" },
            },
        };

        const merger = new SchemaMerger([schema1, schema2, schema3], "prefer_last");
        const result = merger.merge();

        expect(result.mergedSchema.properties).toHaveProperty("a", { type: "object" }); // From schema3
        expect(result.mergedSchema.properties).toHaveProperty("b", { type: "boolean" }); // From schema2
        expect(result.mergedSchema.properties).toHaveProperty("c", { type: "string" }); // From schema2
        expect(result.mergedSchema.properties).toHaveProperty("d", { type: "boolean" }); // From schema3
    });
});