import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV15 } from "../src/schema/tool-output-schema-union-resolver-v15";

describe("ToolOutputSchemaUnionResolverV15", () => {
    it("should throw an error when provided with an empty array of schemas", () => {
        const resolver = new ToolOutputSchemaUnionResolverV15([]);
        expect(() => resolver.resolve([], {})).toThrow("Cannot resolve union of zero schemas.");
    });

    it("should correctly merge two simple string schemas", () => {
        const schemas: FieldSchema[] = [
            { type: "string", description: "Schema A" },
            { type: "string", description: "Schema B" }
        ];
        const resolver = new ToolOutputSchemaUnionResolverV15(schemas);
        const result = resolver.resolve(schemas, {});
        expect(result.type).toBe("string");
        expect(result.description).toContain("Schema A");
        expect(result.description).toContain("Schema B");
    });

    it("should handle merging multiple distinct schemas", () => {
        const schemas: FieldSchema[] = [
            { type: "number", description: "Schema 1" },
            { type: "boolean", description: "Schema 2" },
            { type: "string", description: "Schema 3" }
        ];
        const resolver = new ToolOutputSchemaUnionResolverV15(schemas);
        const result = resolver.resolve(schemas, {});
        expect(result.type).toBe("union");
        expect(result.description).toContain("Schema 1");
        expect(result.description).toContain("Schema 2");
        expect(result.description).toContain("Schema 3");
    });
});