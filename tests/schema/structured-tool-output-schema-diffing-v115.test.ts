import { describe, it, expect } from "vitest";
import { Schema, SchemaField } from "../src/schema/structured-tool-output-schema-diffing-v115";

describe("Schema", () => {
  it("should correctly define a simple string field", () => {
    const schema: Schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "The name of the entity" },
      },
    };
    expect(schema.properties.name).toBeDefined();
    expect(schema.properties.name!.type).toBe("string");
  });

  it("should correctly define a nested object field", () => {
    const schema: Schema = {
      type: "object",
      properties: {
        user_info: {
          type: "object",
          properties: {
            age: { type: "number" },
            is_active: { type: "boolean" },
          },
        },
      },
    };
    expect(schema.properties.user_info).toBeDefined();
    expect(schema.properties.user_info!.properties).toBeDefined();
    expect(schema.properties.user_info!.properties!["age"]!.type).toBe("number");
  });

  it("should handle required fields correctly", () => {
    const schema: Schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string", required: true },
      },
      required: ["id", "email"],
    };
    expect(schema.required).toEqual(["id", "email"]);
  });
});