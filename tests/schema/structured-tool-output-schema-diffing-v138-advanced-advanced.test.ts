import { describe, it, expect } from "vitest";
import { SchemaDiffingEngine } from "../src/schema/structured-tool-output-schema-diffing-v138-advanced-advanced";

describe("SchemaDiffingEngine", () => {
  it("should detect a missing field in the new schema", () => {
    const engine = new SchemaDiffingEngine();
    const oldSchema = {
      type: "object",
      properties: {
        requiredField: { type: "string" },
        optionalField: { type: "string" },
      },
      required: ["requiredField"],
    };
    const newSchema = {
      type: "object",
      properties: {
        requiredField: { type: "string" },
      },
      required: ["requiredField"],
    };

    const diff = engine.diff(oldSchema, newSchema);

    expect(diff).toHaveLength(1);
    expect(diff[0].path).toBe("properties.optionalField");
    expect(diff[0].type).toBe("MISSING");
  });

  it("should detect a type mismatch when a property changes type", () => {
    const engine = new SchemaDiffingEngine();
    const oldSchema = {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
      },
      required: ["id"],
    };
    const newSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id"],
    };

    const diff = engine.diff(oldSchema, newSchema);

    expect(diff).toHaveLength(1);
    expect(diff[0].path).toBe("properties.id.type");
    expect(diff[0].type).toBe("TYPE_MISMATCH");
  });

  it("should detect a structure change when a property becomes an array", () => {
    const engine = new SchemaDiffingEngine();
    const oldSchema = {
      type: "object",
      properties: {
        items: { type: "array", items: { type: "string" } },
      },
      required: ["items"],
    };
    const newSchema = {
      type: "object",
      properties: {
        items: { type: "object", properties: { newProp: { type: "boolean" } } },
      },
      required: ["items"],
    };

    const diff = engine.diff(oldSchema, newSchema);

    expect(diff).toHaveLength(1);
    expect(diff[0].path).toBe("properties.items");
    expect(diff[0].type).toBe("STRUCTURE_CHANGE");
  });
});