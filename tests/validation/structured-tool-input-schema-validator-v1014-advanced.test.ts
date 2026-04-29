import { describe, it, expect } from "vitest";
import { AdvancedSchemaValidator } from "../src/validation/structured-tool-input-schema-validator-v1014-advanced";

describe("AdvancedSchemaValidator", () => {
  it("should validate a simple, correctly structured input against a schema", () => {
    const validator = new AdvancedSchemaValidator();
    const schema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const context: any = { input: { name: "TestUser", age: 30 }, schema: schema };

    const result = validator.validate(context);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors for missing required fields", () => {
    const validator = new AdvancedSchemaValidator();
    const schema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };
    const context: any = { input: { name: "TestUser" }, schema: schema };

    const result = validator.validate(context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: email");
  });

  it("should report errors for incorrect data types", () => {
    const validator = new AdvancedSchemaValidator();
    const schema: any = {
      type: "object",
      properties: {
        itemId: { type: "string" },
        quantity: { type: "number" },
      },
      required: ["itemId", "quantity"],
    };
    const context: any = { input: { itemId: 123, quantity: "two" }, schema: schema };

    const result = validator.validate(context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for property 'itemId': expected string, got number");
    expect(result.errors).toContain("Invalid type for property 'quantity': expected number, got string");
  });
});