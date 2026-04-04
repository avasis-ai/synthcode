import { describe, it, expect } from "vitest";
import { ToolOutputSchemaAggregator } from "../src/tool/schema-aggregator";
import { z } from "zod";

describe("ToolOutputSchemaAggregator", () => {
    it("should aggregate multiple simple schemas correctly", () => {
        const aggregator = new ToolOutputSchemaAggregator();
        const schema1 = z.object({
            id: z.string(),
            name: z.string(),
        });
        const schema2 = z.object({
            description: z.string(),
            status: z.enum(["active", "inactive"]),
        });

        const result = aggregator.aggregate([schema1, schema2]);

        expect(result.conflicts).toEqual([]);
        // Check if the resulting schema has the expected structure and types
        const aggregatedSchema = result.schema;
        expect(aggregatedSchema.shape.id).toBeDefined();
        expect(aggregatedSchema.shape.name).toBeDefined();
        expect(aggregatedSchema.shape.description).toBeDefined();
        expect(aggregatedSchema.shape.status).toBeDefined();

        // Test validation with valid data
        const validData = {
            id: "123",
            name: "Test Tool",
            description: "A test description",
            status: "active",
        };
        const validationResult = aggregator.validate(validData);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toEqual([]);
    });

    it("should detect conflicts when overlapping keys have different types", () => {
        const aggregator = new ToolOutputSchemaAggregator();
        // Schema 1 expects 'result' to be a string
        const schema1 = z.object({
            result: z.string(),
        });
        // Schema 2 expects 'result' to be a number
        const schema2 = z.object({
            result: z.number(),
        });

        const result = aggregator.aggregate([schema1, schema2]);

        expect(result.conflicts).toContain("result");
        // The aggregated schema should ideally handle the conflict or default to a more permissive type if possible,
        // but for this test, we ensure the conflict detection mechanism is triggered.
        expect(result.schema).toBeDefined();
    });

    it("should validate data against the aggregated schema and report errors", () => {
        const aggregator = new ToolOutputSchemaAggregator();
        const schema1 = z.object({
            required_field: z.string().min(1),
        });
        const schema2 = z.object({
            optional_field: z.number().optional(),
        });

        const result = aggregator.aggregate([schema1, schema2]);

        const invalidData = {
            required_field: "", // Too short
            optional_field: "not a number", // Wrong type
        };

        const validationResult = aggregator.validate(invalidData);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toHaveLength(2);
        expect(validationResult.errors).toEqual(expect.arrayContaining([
            "required_field must be at least 1 characters long",
            "optional_field must be a number"
        ]));
    });
});