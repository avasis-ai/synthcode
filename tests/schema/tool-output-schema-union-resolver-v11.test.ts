import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV11 } from "../src/schema/tool-output-schema-union-resolver-v11";

describe("ToolOutputSchemaUnionResolverV11", () => {
    it("should return null when given no union schemas", () => {
        const resolver = new ToolOutputSchemaUnionResolverV11();
        const result = resolver.resolve([]);
        expect(result).toBeNull();
    });

    it("should correctly merge schemas when provided multiple valid schemas", () => {
        const resolver = new ToolOutputSchemaUnionResolverV11();
        const schema1 = { type: "object", properties: { a: { type: "string" } } };
        const schema2 = { type: "object", properties: { b: { type: "number" } } };
        const unionSchemas = [
            { schema: schema1, context: {} },
            { schema: schema2, context: {} }
        ];
        const result = resolver.resolve(unionSchemas);
        expect(result).toEqual({ type: "object", properties: { a: { type: "string" }, b: { type: "number" } } });
    });

    it("should handle schemas with missing or invalid definitions gracefully", () => {
        const resolver = new ToolOutputSchemaUnionResolverV11();
        const schema1 = { type: "object", properties: { a: { type: "string" } } };
        const schema2 = null;
        const schema3 = "invalid";
        const unionSchemas = [
            { schema: schema1, context: {} },
            { schema: schema2, context: {} },
            { schema: schema3, context: {} }
        ];
        const result = resolver.resolve(unionSchemas);
        expect(result).toEqual({ type: "object", properties: { a: { type: "string" } } });
    });
});