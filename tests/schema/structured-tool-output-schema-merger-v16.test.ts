import { describe, it, expect } from "vitest";
import { SchemaMerger, SchemaMergerOptions } from "../src/schema/structured-tool-output-schema-merger-v16";

describe("SchemaMerger", () => {
  it("should merge two simple schemas correctly using default strategy (prefer-latest)", async () => {
    const schemaA: Schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id"],
    };
    const schemaB: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name"],
    };

    const mergedSchema = await SchemaMerger.merge(schemaA, schemaB);

    expect(mergedSchema.properties).toHaveProperty("id");
    expect(mergedSchema.properties).toHaveProperty("name");
    expect(mergedSchema.properties).toHaveProperty("email");
    expect(mergedSchema.required).toEqual(["id", "name"]); // Should combine required fields, but 'name' is present in both, and 'prefer-latest' might keep it or combine them based on implementation. Assuming union for required fields if they are simple arrays.
  });

  it("should merge schemas with a custom resolver function", async () => {
    const schemaA: Schema = {
      type: "object",
      properties: {
        data: { type: "object", properties: { a: { type: "number" } } },
      },
    };
    const schemaB: Schema = {
      type: "object",
      properties: {
        data: { type: "object", properties: { b: { type: "string" } } },
      },
    };

    const customResolver = (key: string, valueA: unknown, valueB: unknown, path: string) => {
      if (key === "data" && typeof valueA === 'object' && typeof valueB === 'object') {
        return {
          type: "object",
          properties: {
            a: (valueA as any).properties?.a || { type: "number" },
            b: (valueB as any).properties?.b || { type: "string" },
          },
        };
      }
      return valueB; // Fallback
    };

    const mergedSchema = await SchemaMerger.merge(schemaA, schemaB, {
      conflictStrategy: "custom-resolver-fn",
      customResolver: customResolver,
    });

    expect(mergedSchema.properties).toHaveProperty("data");
    const dataSchema = mergedSchema.properties.data as any;
    expect(dataSchema.properties).toHaveProperty("a");
    expect(dataSchema.properties).toHaveProperty("b");
  });

  it("should handle merging of nested objects correctly", async () => {
    const schemaA: Schema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
          },
        },
      },
    };
    const schemaB: Schema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            email: { type: "string" },
            department: { type: "string" },
          },
        },
      },
    };

    const mergedSchema = await SchemaMerger.merge(schemaA, schemaB);

    expect(mergedSchema.properties).toHaveProperty("user");
    const userSchema = mergedSchema.properties.user as any;
    expect(userSchema.properties).toHaveProperty("id");
    expect(userSchema.properties).toHaveProperty("username");
    expect(userSchema.properties).toHaveProperty("email");
    expect(userSchema.properties).toHaveProperty("department");
  });
});