import { describe, it, expect } from "vitest";
import { diffSchemas } from "../src/schema/structured-output-schema-diffing-v103-advanced";

describe("diffSchemas", () => {
  it("should correctly identify added fields", () => {
    const oldSchema: any = {
      properties: {
        name: { type: "string" },
      },
    };
    const newSchema: any = {
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
    };
    const diff = diffSchemas(oldSchema, newSchema);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].path).toBe("properties.age");
    expect(diff.removed).toHaveLength(0);
    expect(diff.modified).toHaveLength(0);
  });

  it("should correctly identify removed fields", () => {
    const oldSchema: any = {
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    };
    const newSchema: any = {
      properties: {
        name: { type: "string" },
      },
    };
    const diff = diffSchemas(oldSchema, newSchema);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].path).toBe("properties.email");
    expect(diff.modified).toHaveLength(0);
  });

  it("should correctly identify modified fields", () => {
    const oldSchema: any = {
      properties: {
        name: { type: "string" },
        isActive: { type: "boolean" },
      },
    };
    const newSchema: any = {
      properties: {
        name: { type: "string" },
        isActive: { type: "integer" },
      },
    };
    const diff = diffSchemas(oldSchema, newSchema);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0].path).toBe("properties.isActive");
    expect(diff.modified[0].description).toContain("type");
  });
});