import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV17 } from "../src/schema/tool-output-schema-union-resolver-v17";

describe("ToolOutputSchemaUnionResolverV17", () => {
    it("should return null for empty or null input schemas", () => {
        const resolver = new ToolOutputSchemaUnionResolverV17();
        expect(resolver.resolve(null)).toBeNull();
        expect(resolver.resolve([])).toBeNull();
    });

    it("should correctly merge multiple valid schemas", () => {
        const resolver = new ToolOutputSchemaUnionResolverV17();
        const schema1: any = { type: "object", properties: { a: { type: "string" } } };
        const schema2: any = { type: "object", properties: { b: { type: "number" } } };
        const schemas = [schema1, schema2];

        const result = resolver.resolve(schemas);

        expect(result).toBeDefined();
        expect(result.properties).toEqual({
            a: { type: "string" },
            b: { type: "number" },
        });
    });

    it("should handle schemas with different property types", () => {
        const resolver = new ToolOutputSchemaUnionResolverV17();
        const schema1: any = { type: "object", properties: { id: { type: "string" } } };
        const schema2: any = { type: "object", properties: { count: { type: "integer" } } };
        const schema3: any = { type: "object", properties: { isActive: { type: "boolean" } } };
        const schemas = [schema1, schema2, schema3];

        const result = resolver.resolve(schemas);

        expect(result).toBeDefined();
        expect(result.properties).toEqual({
            id: { type: "string" },
            count: { type: "integer" },
            isActive: { type: "boolean" },
        });
    });
});