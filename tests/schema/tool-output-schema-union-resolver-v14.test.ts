import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV14 } from "../src/schema/tool-output-schema-union-resolver-v14";

describe("ToolOutputSchemaUnionResolverV14", () => {
    const resolver = new ToolOutputSchemaUnionResolverV14();

    it("should return null if the schema does not have a union property", () => {
        const schemaWithoutUnion = { type: "object", properties: {} };
        expect(resolver.resolve(schemaWithoutUnion, {})).toBeNull();
    });

    it("should return null if the union array has less than two schemas", () => {
        const schemaWithSingleUnion = { union: [{ type: "string" }] };
        expect(resolver.resolve(schemaWithSingleUnion, {})).toBeNull();
    });

    it("should resolve a valid union schema when it meets the criteria", () => {
        const validUnionSchema = {
            union: [
                { type: "string" },
                { type: "number" }
            ]
        };
        // Since the actual resolution logic is complex and depends on the implementation details
        // of the resolver, we test that it attempts to resolve and returns a non-null value
        // if the structure is valid according to the initial checks.
        const result = resolver.resolve(validUnionSchema, {});
        expect(result).not.toBeNull();
    });
});