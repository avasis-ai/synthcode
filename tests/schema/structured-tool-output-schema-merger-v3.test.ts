import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV3 } from "../src/schema/structured-tool-output-schema-merger-v3";

describe("StructuredToolOutputSchemaMergerV3", () => {
  it("should merge two simple schemas correctly", () => {
    const userSchema: Record<string, unknown> = {
      name: "string",
      age: "number",
    };
    const systemSchema: Record<string, unknown> = {
      email: "string",
      isActive: "boolean",
    };

    const merger = new StructuredToolOutputSchemaMergerV3(userSchema, systemSchema);
    const result = merger.mergeSchemas();

    expect(result.schema).toEqual({
      name: "string",
      age: "number",
      email: "string",
      isActive: "boolean",
    });
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle overlapping keys by preferring the user context schema", () => {
    const userSchema: Record<string, unknown> = {
      id: "string",
      description: "string",
    };
    const systemSchema: Record<string, unknown> = {
      id: "number",
      createdAt: "string",
    };

    const merger = new StructuredToolOutputSchemaMergerV3(userSchema, systemSchema);
    const result = merger.mergeSchemas();

    expect(result.schema).toEqual({
      id: "string",
      description: "string",
      createdAt: "string",
    });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Overlapping key 'id'");
  });

  it("should return empty schema if both input schemas are empty", () => {
    const userSchema: Record<string, unknown> = {};
    const systemSchema: Record<string, unknown> = {};

    const merger = new StructuredToolOutputSchemaMergerV3(userSchema, systemSchema);
    const result = merger.mergeSchemas();

    expect(result.schema).toEqual({});
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});