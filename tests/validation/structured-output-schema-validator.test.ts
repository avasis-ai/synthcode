import { describe, it, expect } from "vitest";
import { SchemaDefinition, validateStructuredOutput } from "../src/validation/structured-output-schema-validator";

describe("validateStructuredOutput", () => {
  it("should return valid result for a correct schema and data", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    };
    const data = { name: "Alice", age: 30 };
    const result = validateStructuredOutput(data, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required fields", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };
    const data = { name: "Bob" };
    const result = validateStructuredOutput(data, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe("email");
    expect(result.errors[0].message).toContain("is required");
  });

  it("should return invalid result for incorrect data types", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "number" },
        isActive: { type: "boolean" },
      },
      required: ["id", "isActive"],
    };
    const data = { id: "123", isActive: "true" };
    const result = validateStructuredOutput(data, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.some(e => e.path === "id" && e.message.includes("Expected number"))).toBe(true);
    expect(result.errors.some(e => e.path === "isActive" && e.message.includes("Expected boolean"))).toBe(true);
  });
});