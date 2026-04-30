import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1020 } from "../src/validation/structured-tool-output-schema-validator-v1020";

describe("StructuredToolOutputSchemaValidatorV1020", () => {
  it("should validate a perfectly structured output against a simple schema", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1020();
    const schema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const data = { name: "TestUser", age: 30 };
    const report = await validator.validate(data, schema);
    expect(report.isValid).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it("should report errors for missing required fields", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1020();
    const schema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };
    const data = { name: "TestUser" };
    const report = await validator.validate(data, schema);
    expect(report.isValid).toBe(false);
    expect(report.errors).toContain("Missing required property: email");
  });

  it("should report errors for incorrect data types", async () => {
    const validator = new StructuredToolOutputSchemaValidatorV1020();
    const schema: any = {
      type: "object",
      properties: {
        id: { type: "number" },
        isActive: { type: "boolean" },
      },
      required: ["id", "isActive"],
    };
    const data = { id: "not-a-number", isActive: "true" };
    const report = await validator.validate(data, schema);
    expect(report.isValid).toBe(false);
    expect(report.errors).toContain("Type mismatch for property 'id': Expected number, got string");
    expect(report.errors).toContain("Type mismatch for property 'isActive': Expected boolean, got string");
  });
});