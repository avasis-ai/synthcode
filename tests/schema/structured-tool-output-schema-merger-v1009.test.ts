import { describe, it, expect } from "vitest";
import { mergeSchemas } from "../src/schema/structured-tool-output-schema-merger-v1009";

describe("mergeSchemas", () => {
  it("should merge two simple schemas correctly with default resolver", async () => {
    const schema1: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const schema2: any = {
      type: "object",
      properties: {
        age: { type: "integer" },
        email: { type: "string" },
      },
    };

    const merged = await mergeSchemas(schema1, schema2);

    expect(merged.properties.name).toBeDefined();
    expect(merged.properties.age).toBeDefined();
    expect(merged.properties.email).toBeDefined();
    expect(merged.properties.age.type).toBe("integer"); // Should prefer latest/second schema's type if it's a simple overwrite
  });

  it("should handle conflict resolution using 'prefer-latest'", async () => {
    const schema1: any = {
      type: "object",
      properties: {
        fieldA: { type: "string", description: "A from 1" },
        fieldB: { type: "number", default: 10 },
      },
    };
    const schema2: any = {
      type: "object",
      properties: {
        fieldA: { type: "boolean", description: "A from 2" }, // Conflict: type change
        fieldB: { type: "string", default: "default2" }, // Conflict: type change
      },
    };

    const merged = await mergeSchemas(schema1, schema2, { resolver: "prefer-latest" });

    expect(merged.properties.fieldA.type).toBe("boolean");
    expect(merged.properties.fieldA.description).toBe("A from 2");
    expect(merged.properties.fieldB.type).toBe("string");
    expect(merged.properties.fieldB.default).toBe("default2");
  });

  it("should correctly merge schemas using a custom conflict resolver", async () => {
    const schema1: any = {
      type: "object",
      properties: {
        id: { type: "string", description: "ID 1" },
        data: { type: "array", items: { type: "string" } },
      },
    };
    const schema2: any = {
      type: "object",
      properties: {
        id: { type: "number", description: "ID 2" }, // Conflict
        data: { type: "object", properties: { count: { type: "integer" } } }, // Conflict
      },
    };

    const customResolver = (fieldName: string, conflictingValues: unknown[], schemas: any[]): any => {
      if (fieldName === "id") {
        // Custom logic: If one is string and one is number, prefer string
        if (typeof conflictingValues[0] === 'string' || typeof conflictingValues[1] === 'string') {
          return { type: "string", description: "Merged ID (string preferred)" };
        }
        return conflictingValues[0]; // Fallback
      }
      // For 'data', we want to union the properties if possible
      if (fieldName === "data") {
        return {
          type: "object",
          properties: {
            ...((schemas[0].properties?.data?.properties || {})),
            ...((schemas[1].properties?.data?.properties || {})),
          }
        };
      }
      return conflictingValues[0];
    };

    const merged = await mergeSchemas(schema1, schema2, { customConflictResolver: customResolver });

    // Check the custom resolution for 'id'
    expect(merged.properties.id.type).toBe("string");
    expect(merged.properties.id.description).toBe("Merged ID (string preferred)");

    // Check the custom resolution for 'data' (should be an object with merged properties)
    expect(merged.properties.data.type).toBe("object");
    expect(merged.properties.data.properties).toHaveProperty("count");
  });
});