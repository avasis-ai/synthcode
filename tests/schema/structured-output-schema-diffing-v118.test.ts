import { describe, it, expect } from "vitest";
import { SchemaDiffResult } from "../src/schema/structured-output-schema-diffing-v118";
import { diffSchemas } from "../src/schema/structured-output-schema-diffing-v118";

describe("diffSchemas", () => {
    it("should correctly identify added fields", () => {
        const oldSchema: any = {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" },
            },
        };
        const newSchema: any = {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" },
                c: { type: "boolean" },
            },
        };

        const result = diffSchemas(oldSchema, newSchema);

        expect(result.addedFields).toEqual({
            c: { type: "boolean" },
        });
        expect(result.removedFields).toEqual({});
        expect(result.modifiedFields).toEqual({});
    });

    it("should correctly identify removed fields", () => {
        const oldSchema: any = {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" },
            },
        };
        const newSchema: any = {
            type: "object",
            properties: {
                a: { type: "string" },
            },
        };

        const result = diffSchemas(oldSchema, newSchema);

        expect(result.addedFields).toEqual({});
        expect(result.removedFields).toEqual({
            b: { type: "number" },
        });
        expect(result.modifiedFields).toEqual({});
    });

    it("should correctly identify modified fields", () => {
        const oldSchema: any = {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number"},
            },
        };
        const newSchema: any = {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "string"}, // Changed type
            },
        };

        const result = diffSchemas(oldSchema, newSchema);

        expect(result.addedFields).toEqual({});
        expect(result.removedFields).toEqual({});
        expect(result.modifiedFields).toEqual({
            b: {
                old: { type: "number" },
                new: { type: "string" },
                diff: "type changed from number to string",
            },
        });
    });
});