import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1019-advanced";

describe("SchemaValidator", () => {
    it("should validate a simple object structure correctly", () => {
        const schema = {
            type: "object",
            properties: {
                id: { type: "string" },
                isActive: { type: "boolean" },
            },
            required: ["id", "isActive"],
        };
        const validator = new SchemaValidator(schema);
        const data = { id: "test-123", isActive: true };
        expect(validator.isValid(data)).toBe(true);
    });

    it("should fail validation for missing required fields", () => {
        const schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                count: { type: "number" },
            },
            required: ["name", "count"],
        };
        const validator = new SchemaValidator(schema);
        const data = { name: "Test" };
        expect(validator.isValid(data)).toBe(false);
    });

    it("should handle array validation for items", () => {
        const schema = {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: ["items"],
        };
        const validator = new SchemaValidator(schema);
        const data = { items: ["apple", "banana"] };
        expect(validator.isValid(data)).toBe(true);

        const invalidData = { items: ["apple", 123] };
        expect(validator.isValid(invalidData)).toBe(false);
    });
});