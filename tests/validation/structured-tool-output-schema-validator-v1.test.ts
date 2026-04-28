import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1";

describe("SchemaValidator", () => {
  it("should validate a simple object structure correctly", () => {
    const schema = {
      name: { type: "string", required: true },
      age: { type: "number", required: false },
    };
    const validator = new SchemaValidator(schema);
    const report = validator.validate({ name: "TestUser", age: 30 });
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it("should report errors for missing required fields", () => {
    const schema = {
      name: { type: "string", required: true },
      email: { type: "string", required: true },
    };
    const validator = new SchemaValidator(schema);
    const report = validator.validate({ name: "TestUser" });
    expect(report.isValid).toBe(false);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0].path).toBe("email");
  });

  it("should report errors for incorrect data types", () => {
    const schema = {
      id: { type: "number", required: true },
      isActive: { type: "boolean", required: true },
    };
    const validator = new SchemaValidator(schema);
    const report = validator.validate({ id: "not-a-number", isActive: "yes" });
    expect(report.isValid).toBe(false);
    expect(report.errors).toHaveLength(2);
    expect(report.errors.some(e => e.path === "id" && e.constraint === "type")).toBe(true);
    expect(report.errors.some(e => e.path === "isActive" && e.constraint === "type")).toBe(true);
  });
});