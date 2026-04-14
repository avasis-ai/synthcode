import { describe, it, expect } from "vitest";
import { StructuredOutputParser } from "../src/parser/structured-output-parser";

describe("StructuredOutputParser", () => {
  it("should correctly parse a simple JSON string into an object", () => {
    const jsonString = '{"key": "value", "number": 123}';
    const parser = new StructuredOutputParser();
    const result = parser.parse(jsonString);
    expect(result).toEqual({ key: "value", number: 123 });
  });

  it("should handle empty JSON strings gracefully", () => {
    const jsonString = '{}';
    const parser = new StructuredOutputParser();
    const result = parser.parse(jsonString);
    expect(result).toEqual({});
  });

  it("should throw an error for invalid JSON strings", () => {
    const jsonString = '{"key": "value",}'; // Trailing comma makes it invalid JSON
    const parser = new StructuredOutputParser();
    expect(() => parser.parse(jsonString)).toThrow(SyntaxError);
  });
});