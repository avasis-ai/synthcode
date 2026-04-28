import { describe, it, expect } from "vitest";
import {
  StructuredSchema,
  SchemaField,
  ConflictResolutionStrategy,
} from "../src/schema/structured-tool-output-schema-merger-v105";

describe("StructuredToolOutputSchemaMergerV105", () => {
  it("should merge two simple schemas correctly when conflict resolution is LATEST_WINS", () => {
    const schema1: StructuredSchema = {
      type: "object",
      properties: {
        name: { type: "string", description: "Name", required: true },
        age: { type: "integer", description: "Age", required: false },
      },
      required: ["name"],
    };
    const schema2: StructuredSchema = {
      type: "object",
      properties: {
        name: { type: "string", description: "Full Name", required: true },
        email: { type: "string", description: "Email", required: false },
      },
      required: ["name"],
    };

    const mergedSchema = StructuredToolOutputSchemaMergerV105.merge(
      schema1,
      schema2,
      ConflictResolutionStrategy.LATEST_WINS
    );

    expect(mergedSchema.properties).toHaveProperty("name");
    expect(mergedSchema.properties.name).toEqual({
      type: "string",
      description: "Full Name",
      required: true,
      default: undefined,
      properties: undefined,
    });
    expect(mergedSchema.properties).toHaveProperty("age");
    expect(mergedSchema.properties.age).toEqual({
      type: "integer",
      description: "Age",
      required: false,
      default: undefined,
      properties: undefined,
    });
    expect(mergedSchema.properties).toHaveProperty("email");
    expect(mergedSchema.properties.email).toEqual({
      type: "string",
      description: "Email",
      required: false,
      default: undefined,
      properties: undefined,
    });
    expect(mergedSchema.required).toEqual(["name"]);
  });

  it("should correctly merge nested object schemas", () => {
    const schema1: StructuredSchema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          description: "User details",
          required: true,
          properties: {
            id: { type: "string", description: "User ID", required: true },
          },
          required: ["id"],
        },
      },
      required: ["user"],
    };
    const schema2: StructuredSchema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          description: "User details",
          required: true,
          properties: {
            name: { type: "string", description: "User Name", required: true },
          },
          required: ["name"],
        },
      },
      required: ["user"],
    };

    const mergedSchema = StructuredToolOutputSchemaMergerV105.merge(
      schema1,
      schema2,
      ConflictResolutionStrategy.LATEST_WINS
    );

    expect(mergedSchema.properties).toHaveProperty("user");
    const userSchema = mergedSchema.properties.user as SchemaField;
    expect(userSchema.properties).toHaveProperty("id");
    expect(userSchema.properties).toHaveProperty("name");
    expect(userSchema.properties.name).toEqual({
      type: "string",
      description: "User Name",
      required: true,
      default: undefined,
      properties: undefined,
    });
    expect(userSchema.required).toEqual(["id", "name"]);
  });

  it("should handle missing properties in the second schema gracefully", () => {
    const schema1: StructuredSchema = {
      type: "object",
      properties: {
        a: { type: "string", description: "A", required: true },
        b: { type: "integer", description: "B", required: false },
      },
      required: ["a"],
    };
    const schema2: StructuredSchema = {
      type: "object",
      properties: {
        c: { type: "boolean", description: "C", required: false },
      },
      required: [],
    };

    const mergedSchema = StructuredToolOutputSchemaMergerV105.merge(
      schema1,
      schema2,
      ConflictResolutionStrategy.LATEST_WINS
    );

    expect(mergedSchema.properties).toHaveProperty("a");
    expect(mergedSchema.properties).toHaveProperty("b");
    expect(mergedSchema.properties).toHaveProperty("c");
    expect(mergedSchema.required).toEqual(["a"]);
  });
});