import { describe, it, expect } from "vitest";
import { SchemaDiffingV15 } from "../src/schema/structured-tool-output-schema-diffing-v15";

describe("SchemaDiffingV15", () => {
  it("should correctly identify added fields", () => {
    const oldSchema: Record<string, any> = {
      fieldA: { name: "fieldA", type: "string", required: true },
    };
    const newSchema: Record<string, any> = {
      fieldA: { name: "fieldA", type: "string", required: true },
      fieldB: { name: "fieldB", type: "number", required: false },
    };
    const diff = SchemaDiffingV15.diff(oldSchema, newSchema);
    expect(diff).toHaveLength(1);
    expect(diff[0].field).toBe("fieldB");
    expect(diff[0].changes.type).toBe("added");
  });

  it("should correctly identify removed fields", () => {
    const oldSchema: Record<string, any> = {
      fieldA: { name: "fieldA", type: "string", required: true },
      fieldC: { name: "fieldC", type: "boolean", required: false },
    };
    const newSchema: Record<string, any> = {
      fieldA: { name: "fieldA", type: "string", required: true },
    };
    const diff = SchemaDiffingV15.diff(oldSchema, newSchema);
    expect(diff).toHaveLength(1);
    expect(diff[0].field).toBe("fieldC");
    expect(diff[0].changes.type).toBe("removed");
  });

  it("should correctly identify modified fields", () => {
    const oldSchema: Record<string, any> = {
      fieldA: { name: "fieldA", type: "string", required: true },
      fieldB: { name: "fieldB", type: "number", required: false },
    };
    const newSchema: Record<string, any> = {
      fieldA: { name: "fieldA", type: "string", required: false }, // Modified required
      fieldB: { name: "fieldB", type: "string", required: false }, // Modified type
    };
    const diff = SchemaDiffingV15.diff(oldSchema, newSchema);
    expect(diff).toHaveLength(2);
    expect(diff).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "fieldA", changes: { type: "modified", details: expect.any(Object) } }),
      expect.objectContaining({ field: "fieldB", changes: { type: "modified", details: expect.any(Object) } }),
    ]));
  });
});