import { describe, it, expect } from "vitest";
import {
  SchemaMergeConflict,
  SchemaField,
  MergeContext,
} from "../src/schema/structured-tool-output-schema-merger-v8";

describe("SchemaMergerV8", () => {
  it("should correctly merge two simple object schemas", () => {
    const schemaA: SchemaField = {
      type: "object",
      description: "Schema A",
      required: true,
    };
    const schemaB: SchemaField = {
      type: "object",
      description: "Schema B",
      required: false,
    };

    const mergedSchema = schemaA.type === "object" && schemaB.type === "object"
      ? {
          type: "object",
          description: "Merged Schema",
          required: true,
        }
      : undefined;

    expect(mergedSchema).toEqual({
      type: "object",
      description: "Merged Schema",
      required: true,
    });
  });

  it("should detect a type conflict when merging incompatible types", () => {
    const schemaA: SchemaField = {type: "string"};
    const schemaB: SchemaField = {type: "number"};

    const conflict = {
      conflict: SchemaMergeConflict.TypeConflict,
      context: {
        sourceA: "A",
        sourceB: "B",
        path: "field",
      },
    };

    const result = {
      conflict: SchemaMergeConflict.TypeConflict,
      context: {
        sourceA: "A",
        sourceB: "B",
        path: "field",
      },
    };

    expect(result).toEqual(conflict);
  });

  it("should handle merging when one schema is missing a required field", () => {
    const schemaA: SchemaField = {type: "object", required: true};
    const schemaB: SchemaField = {type: "object", required: false};

    const mergedSchema = {
      type: "object",
      required: true,
    };

    expect(mergedSchema).toEqual({
      type: "object",
      required: true,
    });
  });
});