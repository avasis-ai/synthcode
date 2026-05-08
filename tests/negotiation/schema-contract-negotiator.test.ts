import { describe, it, expect } from "vitest";
import { SchemaContractNego } from "../src/negotiation/schema-contract-negotiator";

describe("SchemaContractNego", () => {
    it("should correctly initialize with a schema and context", () => {
        const schema: Schema = {
            id: { type: 'string', required: true },
            value: { type: 'number', required: false },
        };
        const context: NegotiationContext = {
            stepName: "schema_validation",
            availableTools: ["validator"],
        };
        const negator = new SchemaContractNego(schema, context);
        expect(negator).toBeInstanceOf(SchemaContractNego);
    });

    it("should generate a contract when schema and context are provided", () => {
        const schema: Schema = {
            name: { type: 'string', required: true, description: "The name of the entity." },
            age: { type: 'number', required: false, default: 30 },
        };
        const context: NegotiationContext = {
            stepName: "user_input_gathering",
            availableTools: ["user_input_tool"],
        };
        const negator = new SchemaContractNego(schema, context);
        const contract = negator.generateContract();
        expect(contract).toBeDefined();
        expect(typeof contract).toBe("string");
        expect(contract).toContain("Schema Contract");
    });

    it("should handle missing required fields in the schema gracefully", () => {
        const schema: Schema = {
            requiredField: { type: 'string', required: true },
            optionalField: { type: 'string', required: false },
        };
        const context: NegotiationContext = {
            stepName: "schema_validation",
            availableTools: [],
        };
        const negator = new SchemaContractNego(schema, context);
        const contract = negator.generateContract();
        expect(contract).toBeDefined();
        expect(contract).toContain("requiredField");
        expect(contract).toContain("optionalField");
    });
});