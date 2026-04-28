import { describe, it, expect } from "vitest";
import { SchemaDiff } from "../src/schema/structured-tool-output-schema-diffing-v1";

describe("SchemaDiff", () => {
    it("should correctly identify added fields", () => {
        const diff: SchemaDiff = {
            added: {
                newField: "some value",
            },
            removed: {},
            modified: {},
        };
        expect(diff.added).toHaveProperty("newField", "some value");
    });

    it("should correctly identify removed fields", () => {
        const diff: SchemaDiff = {
            added: {},
            removed: {
                oldField: "some value",
            },
            modified: {},
        };
        expect(diff.removed).toHaveProperty("oldField", "some value");
    });

    it("should correctly identify modified fields", () => {
        const diff: SchemaDiff = {
            added: {},
            removed: {},
            modified: {
                fieldName: {
                    old: {
                        type: "string",
                        description: "old desc",
                    },
                    new: {
                        type: "number",
                        description: "new desc",
                    },
                    changes: {
                        type: "type",
                        messa: "type changed",
                    },
                },
            },
        };
        expect(diff.modified).toHaveProperty("fieldName", {
            old: {
                type: "string",
                description: "old desc",
            },
            new: {
                type: "number",
                description: "new desc",
            },
            changes: {
                type: "type",
                messa: "type changed",
            },
        });
    });
});