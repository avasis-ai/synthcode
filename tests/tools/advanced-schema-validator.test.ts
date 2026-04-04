import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/tools/advanced-schema-validator";

describe("SchemaValidator", () => {
    it("should correctly validate data against a simple schema", () => {
        const schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" }
            },
            required: ["name", "age"]
        };
        const validator = new SchemaValidator(schema);
        const data = { name: "Test", age: 30 };
        const result = validator.validate(data);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should return invalid when required fields are missing", () => {
        const schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" }
            },
            required: ["name", "age"]
        };
        const validator = new SchemaValidator(schema);
        const data = { name: "Test" };
        const result = validator.validate(data);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
    });

    it("should return invalid when data types do not match schema", () => {
        const schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" }
            },
            required: ["name", "age"]
        };
        const validator = new SchemaValidator(schema);
        const data = { name: "Test", age: "twenty" };
        const result = validator.validate(data);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining("age"));
    });
});