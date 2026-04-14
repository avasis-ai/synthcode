import { describe, it, expect } from "vitest";
import { StructuredOutputParserImpl } from "../../src/parser/structured-output-parser.js";

describe("StructuredOutputParser", () => {
  const parser = new StructuredOutputParserImpl();
  const schema = { type: "object", properties: { key: { type: "string" } } };

  it("should parse valid JSON", async () => {
    const result = await parser.parse(schema, '{"key": "value"}');
    expect(result).toEqual({ key: "value" });
  });

  it("should parse empty JSON object", async () => {
    const result = await parser.parse(schema, '{}');
    expect(result).toEqual({});
  });

  it("should validate correct data against schema", () => {
    expect(parser.validate({ key: "value" }, schema)).toBe(true);
  });

  it("should reject null against object schema", () => {
    expect(parser.validate(null, schema)).toBe(false);
  });
});
