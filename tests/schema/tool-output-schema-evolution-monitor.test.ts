import { describe, it, expect } from "vitest";
import { SchemaRegistry } from "../src/schema/tool-output-schema-evolution-monitor";

describe("SchemaRegistry", () => {
  it("should correctly register a new schema and return metadata", () => {
    const registry = new SchemaRegistry();
    const toolName = "testTool";
    const initialSchema = { id: "string", count: "number" };
    const metadata = registry.registerSchema(toolName, initialSchema);

    expect(metadata.version).toBe(1);
    expect(metadata.schema).toEqual(initialSchema);
    expect(registry.getSchema(toolName, 1)).toEqual(metadata);
  });

  it("should return undefined for a non-existent schema version", () => {
    const registry = new SchemaRegistry();
    const toolName = "testTool";
    registry.registerSchema(toolName, { a: "string" });
    expect(registry.getSchema(toolName, 99)).toBeUndefined();
  });

  it("should handle schema updates and track version changes", () => {
    const registry = new SchemaRegistry();
    const toolName = "testTool";
    registry.registerSchema(toolName, { a: "string" }); // Version 1
    
    const updatedSchema = { a: "string", b: "boolean" };
    const metadataV2 = registry.registerSchema(toolName, updatedSchema); // Version 2

    expect(metadataV2.version).toBe(2);
    expect(registry.getSchema(toolName, 2)).toEqual(metadataV2);
  });
});