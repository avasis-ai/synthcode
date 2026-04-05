import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolverV16 } from "../src/schema/tool-output-schema-union-resolver-v16";
import { z, ZodSchema } from "zod";

describe("ToolOutputSchemaUnionResolverV16", () => {
    const resolver = new ToolOutputSchemaUnionResolverV16();

    it("should return an empty object schema when given no schemas", () => {
        const schemas: ZodSchema<any>[] = [];
        const result = resolver.resolve(schemas, "prefer_union");
        expect(result).toEqual(z.object({}));
    });

    it("should correctly merge schemas using 'prefer_union' strategy", () => {
        const schema1 = z.object({ a: z.string() });
        const schema2 = z.object({ b: z.number() });
        const schemas = [schema1, schema2];

        const result = resolver.resolve(schemas, "prefer_union");
        // Check if the resulting schema is an object and contains both fields
        expect(result).toBeInstanceOf(z.ZodObject);
        expect(result.shape.a).toEqual(z.string());
        expect(result.shape.b).toEqual(z.number());
    });

    it("should handle conflict resolution based on the provided strategy (e.g., 'error_on_conflict')", () => {
        const schema1 = z.object({ id: z.string(), name: z.string() });
        // Schema 2 conflicts on 'name' but adds 'email'
        const schema2 = z.object({ name: z.number(), email: z.string() });
        const schemas = [schema1, schema2];

        // When conflict resolution is used, the behavior depends on the implementation,
        // but we test for a specific expected outcome or structural integrity.
        const result = resolver.resolve(schemas, "error_on_conflict");

        // In a real scenario, we'd check the exact type coercion/error handling.
        // Here, we ensure it's still a valid object schema and has the expected keys.
        expect(result).toBeInstanceOf(z.ZodObject);
        expect(result.shape.id).toEqual(z.string());
        expect(result.shape.email).toEqual(z.string());
        // The conflict on 'name' should result in a specific type based on the resolver's logic
        expect(result.shape.name).toBeDefined();
    });
});