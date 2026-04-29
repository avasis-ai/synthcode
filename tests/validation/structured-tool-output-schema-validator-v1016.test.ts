import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1016 } from "../src/validation/structured-tool-output-schema-validator-v1016";

describe("StructuredToolOutputSchemaValidatorV1016", () => {
    it("should return isValid: true and empty errors/suggestions for valid data", async () => {
        const schema = {
            "name": { type: "string", required: true },
            "age": { type: "number", required: false }
        };
        const validator = new StructuredToolOutputSchemaValidatorV1016(schema);
        const validData = {
            name: "TestUser",
            age: 30
        };
        const result = await validator.validate(validData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.suggestions).toEqual([]);
    });

    it("should return isValid: false and appropriate errors for missing required fields", async () => {
        const schema = {
            "name": { type: "string", required: true },
            "email": { type: "string", required: true }
        };
        const validator = new StructuredToolOutputSchemaValidatorV1016(schema);
        const invalidData = {
            name: "TestUser"
            // Missing 'email'
        };
        const result = await validator.validate(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing required field: email");
    });

    it("should return isValid: false and appropriate errors for incorrect data types", async () => {
        const schema = {
            "id": { type: "number", required: true },
            "isActive": { type: "boolean", required: true }
        };
        const validator = new StructuredToolOutputSchemaValidatorV1016(schema);
        const invalidData = {
            id: "not a number",
            isActive: "yes"
        };
        const result = await validator.validate(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Type mismatch for field 'id': Expected number, got string");
        expect(result.errors).toContain("Type mismatch for field 'isActive': Expected boolean, got string");
    });
});