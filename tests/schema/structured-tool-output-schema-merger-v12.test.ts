import { describe, it, expect } from "vitest";
import {
  ConflictResolutionStrategy,
  SchemaDefinition,
  SchemaMergeReport,
  mergeSchemas,
} from "../src/schema/structured-tool-output-schema-merger-v12";

describe("mergeSchemas", () => {
  it("should merge two simple schemas correctly with Union strategy", async () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
      required: ["name"],
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name"],
    };

    const merged = await mergeSchemas(
      schema1,
      schema2,
      ConflictResolutionStrategy.Union
    );

    expect(merged.properties).toHaveProperty("name");
    expect(merged.properties).toHaveProperty("age");
    expect(merged.properties).toHaveProperty("email");
    expect(merged.required).toEqual(["name", "age", "email"]);
  });

  it("should handle conflicts using Intersection strategy", async () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
      required: ["id"],
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
      required: ["id"],
    };

    const merged = await mergeSchemas(
      schema1,
      schema2,
      ConflictResolutionStrategy.Intersection
    );

    expect(merged.properties).toHaveProperty("id");
    expect(merged.properties).toHaveProperty("value");
    expect(merged.required).toEqual(["id"]);
  });

  it("should use LastWriteWins strategy for conflicting properties", async () => {
    const schema1: SchemaDefinition = {
      type: "object",
      properties: {
        commonField: { type: "string" },
        uniqueField1: { type: "boolean" },
      },
      required: ["commonField"],
    };
    const schema2: SchemaDefinition = {
      type: "object",
      properties: {
        commonField: { type: "integer" },
        uniqueField2: { type: "string" },
      },
      required: ["commonField"],
    };

    const merged = await mergeSchemas(
      schema1,
      schema2,
      ConflictResolutionStrategy.LastWriteWins
    );

    // In LastWriteWins, schema2's definition for commonField should prevail
    expect(merged.properties).toHaveProperty("commonField");
    expect(merged.properties.commonField).toEqual({ type: "integer" });
    expect(merged.properties).toHaveProperty("uniqueField1");
    expect(merged.properties).toHaveProperty("uniqueField2");
  });
});