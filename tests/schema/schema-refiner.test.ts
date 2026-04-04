import { describe, it, expect, vi } from "vitest";
import { SchemaRefiner } from "../src/schema/schema-refiner";
import { Schema } from "../src/schema/schema";
import { ValidationResult } from "../src/types";

describe("SchemaRefiner", () => {
    it("should refine the schema when given errors and examples", async () => {
        const mockLlmClient = {
            generateContent: vi.fn().mockResolvedValue(JSON.stringify({
                type: "object",
                properties: {
                    name: { type: "string" },
                    age: { type: "integer" }
                }
            })),
        };
        const schemaRefiner = new SchemaRefiner(mockLlmClient);

        const initialSchema: Schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "string" } // Incorrect type
            }
        };
        const errors: ValidationResult[] = [{ field: "age", message: "Expected integer, got string" }];
        const examples: any[] = [{ name: "Test", age: 30 }];

        const refinedSchema = await schemaRefiner.refine(initialSchema, errors, examples);

        expect(mockLlmClient.generateContent).toHaveBeenCalledTimes(1);
        expect(refinedSchema).toEqual({
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "integer" }
            }
        });
    });

    it("should return the original schema if no errors are provided", async () => {
        const mockLlmClient = {
            generateContent: vi.fn().mockResolvedValue("{}"),
        };
        const schemaRefiner = new SchemaRefiner(mockLlmClient);

        const initialSchema: Schema = {
            type: "object",
            properties: {
                name: { type: "string" }
            }
        };
        const errors: ValidationResult[] = [];
        const examples: any[] = [{ name: "Test" }];

        const refinedSchema = await schemaRefiner.refine(initialSchema, errors, examples);

        expect(mockLlmClient.generateContent).not.toHaveBeenCalled();
        expect(refinedSchema).toEqual(initialSchema);
    });

    it("should handle empty inputs gracefully", async () => {
        const mockLlmClient = {
            generateContent: vi.fn().mockResolvedValue("{}"),
        };
        const schemaRefiner = new SchemaRefiner(mockLlmClient);

        const initialSchema: Schema = { type: "object", properties: {} };
        const errors: ValidationResult[] = [];
        const examples: any[]: any[] = [];

        const refinedSchema = await schemaRefiner.refine(initialSchema, errors, examples);

        expect(mockLlmClient.generateContent).not.toHaveBeenCalled();
        expect(refinedSchema).toEqual(initialSchema);
    });
});