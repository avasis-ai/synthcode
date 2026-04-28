import { describe, it, expect } from "vitest";
import { diffSchemas } from "../src/schema/structured-tool-output-schema-diffing-v114";

describe("diffSchemas", () => {
    it("should return an empty diff when schemas are identical", () => {
        const schemaA: any = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "integer" }
            }
        };
        const schemaB: any = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "integer" }
            }
        };

        const result = diffSchemas(schemaA, schemaB);
        expect(result.diff).toEqual({
            added: {},
            removed: {},
            modified: {}
        });
    });

    it("should detect added properties in schemaB", () => {
        const schemaA: any = {
            type: "object",
            properties: {
                name: { type: "string" }
            }
        };
        const schemaB: any = {
            type: "object",
            properties: {
                name: { type: "string" },
                email: { type: "string" }
            }
        };

        const result = diffSchemas(schemaA, schemaB);
        expect(result.diff.added).toHaveProperty("email");
        expect(result.diff.added.email).toEqual({ type: "string" });
        expect(result.diff.removed).toEqual({});
        expect(result.diff.modified).toEqual({});
    });

    it("should detect removed properties in schemaA", () => {
        const schemaA: any = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "integer" }
            }
        };
        const schemaB: any = {
            type: "object",
            properties: {
                name: { type: "string" }
            }
        };

        const result = diffSchemas(schemaA, schemaB);
        expect(result.diff.removed).toHaveProperty("age");
        expect(result.diff.removed.age).toEqual({ type: "integer" });
        expect(result.diff.added).toEqual({});
        expect(result.diff.modified).toEqual({});
    });
});