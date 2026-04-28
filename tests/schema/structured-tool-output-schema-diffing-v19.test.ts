import { describe, it, expect } from "vitest";
import {
    SchemaDiff,
    DiffReport,
    diffSchemas,
} from "../src/schema/structured-tool-output-schema-diffing-v19";

describe("diffSchemas", () => {
    it("should return an empty diff report for identical schemas", () => {
        const schema1 = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "integer" },
            },
        };
        const schema2 = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "integer" },
            },
        };

        const report = diffSchemas(schema1, schema2);
        expect(report.diffs).toEqual([]);
        expect(report.summary.totalDifferences).toBe(0);
    });

    it("should detect a type change when a field type is modified", () => {
        const schema1 = {
            type: "object",
            properties: {
                id: { type: "string" },
                count: { type: "integer" },
            },
        };
        const schema2 = {
            type: "object",
            properties: {
                id: { type: "string" },
                count: { type: "string" }, // Changed from integer to string
            },
        };

        const report = diffSchemas(schema1, schema2);
        expect(report.diffs.length).toBeGreaterThan(0);
        const typeChangeDiff = report.diffs.find(d =>
            d.path === "properties.count" && d.changeType === "typeChange"
        );
        expect(typeChangeDiff).toBeDefined();
        expect(typeChangeDiff?.oldValue).toBe("integer");
        expect(typeChangeDiff?.newValue).toBe("string");
    });

    it("should detect a required field change when a property becomes required", () => {
        const schema1 = {
            type: "object",
            properties: {
                user_id: { type: "string" },
                email: { type: "string" },
            },
        };
        const schema2 = {
            type: "object",
            required: ["user_id", "email"], // Added required fields
            properties: {
                user_id: { type: "string" },
                email: { type: "string" },
            },
        };

        const report = diffSchemas(schema1, schema2);
        expect(report.diffs.length).toBeGreaterThan(0);
        const requiredChangeDiff = report.diffs.find(d =>
            d.path === "required" && d.changeType === "requiredChange"
        );
        expect(requiredChangeDiff).toBeDefined();
        expect(requiredChangeDiff?.oldValue).toEqual([]);
        expect(requiredChangeDiff?.newValue).toEqual(["user_id", "email"]);
    });
});