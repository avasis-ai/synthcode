import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnionResolver } from "../src/schema/tool-output-schema-union-resolver";
import { z } from "zod";

describe("ToolOutputSchemaUnionResolver", () => {
  const resolver = new ToolOutputSchemaUnionResolver();

  it("should resolve an empty array of schemas to z.any()", () => {
    const result = resolver.resolve([], "UNION");
    expect(result).toBe(z.any());
  });

  it("should resolve multiple schemas using UNION strategy", () => {
    const schema1 = z.object({ a: z.string() });
    const schema2 = z.object({ b: z.number() });
    const schemas = [schema1, schema2];

    const result = resolver.resolve(schemas, "UNION");
    // Check if the resulting schema is indeed a union of the inputs
    expect(result).toBe(z.union([schema1, schema2]));
  });

  it("should resolve multiple schemas using INTERSECTION strategy", () => {
    const schema1 = z.object({ id: z.string(), name: z.string() });
    const schema2 = z.object({ id: z.string(), age: z.number() });
    const schemas = [schema1, schema2];

    const result = resolver.resolve(schemas, "INTERSECTION");
    // Check if the resulting schema is an intersection of the inputs
    expect(result).toBe(z.intersection([schema1, schema2]));
  });
});