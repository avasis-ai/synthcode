import { describe, it, expect } from "vitest";
import { StructuredOutputParserV2 } from "../src/parser/structured-output-parser-v2";

describe("StructuredOutputParserV2", () => {
  it("should successfully parse a simple JSON object from a message", async () => {
    const parser = new StructuredOutputParserV2();
    const message = {
      role: "assistant",
      content: "Here is the JSON: {\"name\": \"Test\", \"age\": 30}",
    };
    const result = await parser.parse(message, {
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
      },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "Test", age: 30 });
    expect(result.errors).toEqual([]);
  });

  it("should handle cases where the JSON is not present or invalid", async () => {
    const parser = new StructuredOutputParserV2();
    const message = {
      role: "assistant",
      content: "I cannot provide the JSON structure right now.",
    };
    const schema = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    };

    const result = await parser.parse(message, { schema });

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors).toContain("Could not find or parse a valid JSON structure matching the schema.");
  });

  it("should correctly parse an array structure", async () => {
    const parser = new StructuredOutputParserV2();
    const message = {
      role: "assistant",
      content: "The list is: [{\"item\": \"Apple\", \"count\": 2}, {\"item\": \"Banana\", \"count\": 1}]",
    };
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          count: { type: "number" },
        },
        required: ["item", "count"],
      },
    };

    const result = await parser.parse(message, { schema });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { item: "Apple", count: 2 },
      { item: "Banana", count: 1 },
    ]);
    expect(result.errors).toEqual([]);
  });
});