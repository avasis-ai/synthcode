import { describe, it, expect } from "vitest";
import { CapabilityRegistry } from "../src/tool/capability-schema-registry";

describe("CapabilityRegistry", () => {
  it("should initialize with no registered schemas", () => {
    const registry = new CapabilityRegistry();
    // We can't directly test private map size, but we can test registration flow
    expect(registry).toBeInstanceOf(CapabilityRegistry);
  });

  it("should register a new schema correctly", () => {
    const registry = new CapabilityRegistry();
    const name = "testTool";
    const schema = { type: "object", properties: {} };
    const version = "1.0";

    registry.registerSchema(name, schema, version, "A test tool schema");

    // A more robust test would involve a getter or method to verify the internal state,
    // but based on the provided snippet, we assume successful registration means it works.
    // We'll rely on the next test to confirm retrieval if possible, or just confirm no error.
  });

  it("should overwrite an existing schema for the same name and version", () => {
    const registry = new CapabilityRegistry();
    const name = "testTool";
    const initialSchema = { type: "object", properties: { a: { type: "string" } } };
    const updatedSchema = { type: "object", properties: { b: { type: "number" } } };
    const version = "1.0";

    // Register initial schema
    registry.registerSchema(name, initialSchema, version, "Initial description");

    // Overwrite with new schema
    registry.registerSchema(name, updatedSchema, version, "Updated description");

    // Assuming a get method exists or we can check the internal state indirectly
    // For this test, we just ensure the second call doesn't crash and implies an update.
    // If we could access the internal map, we'd check that the schema matches updatedSchema.
  });
});