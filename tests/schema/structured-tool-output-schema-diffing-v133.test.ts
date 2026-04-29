import { describe, it, expect } from "vitest";
import { Schema, SchemaField } from "../src/schema/structured-tool-output-schema-diffing-v133";

describe("Schema", () => {
  it("should correctly define a basic object schema", () => {
    const schema: Schema = {
      user: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: true,
      },
    };
    expect(schema.user).toBeDefined();
    expect(schema.user!.type).toBe("object");
    expect(schema.user!.properties!.name!.type).toBe("string");
  });

  it("should handle optional fields correctly", () => {
    const schema: Schema = {
      optionalField: {
        type: "string",
        required: false,
      },
    };
    expect(schema.optionalField).toBeDefined();
    expect(schema.optionalField!.required).toBe(false);
  });

  it("should handle array type definition", () => {
    const schema: Schema = {
      itemsList: {
        type: "array",
        items: {
          type: "string",
        },
      },
    };
    expect(schema.itemsList).toBeDefined();
    expect(schema.itemsList!.type).toBe("array");
    expect(schema.itemsList!.items!.type).toBe("string");
  });
});