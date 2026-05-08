import { describe, it, expect } from "vitest";
import { ProtocolAdherenceValidator } from "../src/validation/contextual-protocol-adherence-validator";

describe("ProtocolAdherenceValidator", () => {
    it("should validate a payload against a simple protocol definition successfully", () => {
        const validator = new ProtocolAdherenceValidator();
        const protocolDefinition = {
            requiredFields: {
                id: { type: 'number', required: true },
                name: { type: 'string', required: true },
                isActive: { type: 'boolean', required: false },
            },
        };
        const payload = {
            id: 123,
            name: "Test Item",
            isActive: true,
        };

        const result = validator.validate(payload, protocolDefinition);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should detect missing required fields and type mismatches", () => {
        const validator = new ProtocolAdherenceValidator();
        const protocolDefinition = {
            requiredFields: {
                requiredId: { type: 'number', required: true },
                description: { type: 'string', required: true },
                optionalField: { type: 'boolean', required: false },
            },
        };
        const payload = {
            requiredId: "not a number", // Type mismatch
            // description is missing (required)
            optionalField: 123, // Type mismatch
        };

        const result = validator.validate(payload, protocolDefinition);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain("Missing required field: description");
        expect(result.errors).toContain("Field 'optionalField' expected type 'boolean' but received type 'number'");
    });

    it("should handle custom format checks and schema validation", () => {
        const validator = new ProtocolAdherenceValidator();
        const protocolDefinition = {
            requiredFields: {
                sku: { type: 'string', required: true, formatCheck: (value) => typeof value === 'string' && value.length > 5 },
                price: { type: 'number', required: true },
            },
            schemaCheck: (payload) => payload.price > 0 && payload.sku.includes("-")
        };
        const payload = {
            sku: "ABC-12345",
            price: 99.99
        };

        // Test successful validation
        let result = validator.validate(payload, protocolDefinition);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);

        // Test failed schema check
        const badPayload = {
            sku: "ABC-12345",
            price: -10.00
        };
        result = validator.validate(badPayload, protocolDefinition);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Schema validation failed: Price must be positive.");
    });
});