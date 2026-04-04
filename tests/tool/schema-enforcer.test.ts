import { describe, it, expect } from "vitest";
import { SchemaEnforcer } from "../src/tool/schema-enforcer";

describe("SchemaEnforcer", () => {
  it("should correctly enforce a simple string field", async () => {
    const enforcer = new SchemaEnforcer();
    const schema: Record<string, any> = {
      name: { type: "string", required: true },
    };
    const rawOutput: Record<string, unknown> = { name: "TestUser" };
    const result = await enforcer.enforce(rawOutput, schema);
    expect(result).toEqual({ name: "TestUser" });
  });

  it("should handle a required field that is missing", async () => {
    const enforcer = new SchemaEnforcer();
    const schema: Record<string, any> = {
      requiredField: { type: "string", required: true },
    };
    const rawOutput: Record<string, unknown> = {};
    // Assuming the implementation throws or returns a specific error/null structure for missing required fields
    // Based on the signature, we expect it to return a record, so we test for a specific failure mode if known,
    // or assume it handles it gracefully if the test environment dictates.
    // For this test, we assume it throws if a required field is missing.
    await expect(enforcer.enforce(rawOutput, schema)).rejects.toThrow();
  });

  it("should apply a transformation function correctly", async () => {
    const enforcer = new SchemaEnforcer();
    const schema: Record<string, any> = {
      age: { type: "number", transform: (value: unknown, context: Record<string, unknown>) => (value as number) * 2 },
    };
    const rawOutput: Record<string, unknown> = { age: 10 };
    const result = await enforcer.enforce(rawOutput, schema);
    expect(result).toEqual({ age: 20 });
  });
});