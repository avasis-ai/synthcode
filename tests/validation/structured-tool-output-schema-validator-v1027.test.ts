import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1027 } from "../src/validation/structured-tool-output-schema-validator-v1027";
import { SchemaDefinition } from "../src/validation/schema-validator";
import { ValidatorContext } from "../src/validation/base-validator";
import { ValidationResult } from "../src/validation/schema-validator";

describe("StructuredToolOutputSchemaValidatorV1027", () => {
    it("should return success when tool output matches the schema", () => {
        const mockSchema: SchemaDefinition = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name", "age"],
        };
        const mockToolOutput = { name: "TestUser", age: 30 };
        const context: ValidatorContext = { /* mock context */ };

        const validator = new StructuredToolOutputSchemaValidatorV1027(mockSchema, mockToolOutput);
        const result = validator.validate(context);

        expect(result.isValid).toBe(true);
    });

    it("should return failure when tool output is missing a required field", () => {
        const mockSchema: SchemaDefinition = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name", "age"],
        };
        const mockToolOutput = { name: "TestUser" }; // Missing age
        const context: ValidatorContext = { /* mock context */ };

        const validator = new StructuredToolOutputSchemaValidatorV1027(mockSchema, mockToolOutput);
        const result = validator.validate(context);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
    });

    it("should return failure when tool output has incorrect data type", () => {
        const mockSchema: SchemaDefinition = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name", "age"],
        };
        const mockToolOutput = { name: "TestUser", age: "thirty" }; // age should be number
        const context: ValidatorContext = { /* mock context */ };

        const validator = new StructuredToolOutputSchemaValidatorV1027(mockSchema, mockToolOutput);
        const result = validator.validate(context);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ field: "age", message: "Expected type number, got string" }));
    });
});