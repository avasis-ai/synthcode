import { describe, it, expect } from "vitest";
import { SchemaResolver } from "../src/schema/tool-output-schema-union-resolver-v6";

describe("SchemaResolver", () => {
  it("should correctly resolve a simple union of two types", () => {
    const schema: any = {
      type: "oneOf",
      oneOf: [
        { type: "string" },
        { type: "number" },
      ],
    };
    const resolver = new SchemaResolver(schema);
    const result = resolver.resolve({ value: "hello" });
    expect(result).toBe("string");
  });

  it("should correctly resolve a union when the first type matches", () => {
    const schema: any = {
      type: "oneOf",
      oneOf: [
        { type: "boolean" },
        { type: "string" },
      ],
    };
    const resolver = new SchemaResolver(schema);
    const result = resolver.resolve({ value: true });
    expect(result).toBe("boolean");
  });

  it("should correctly resolve a union when the second type matches", () => {
    const schema: any = {
      type: "oneOf",
      oneOf: [
        { type: "string" },
        { type: "number" },
      ],
    };
    const resolver = new SchemaResolver(schema);
    const result = resolver.resolve({ value: 123 });
    expect(result).toBe("number");
  });
});