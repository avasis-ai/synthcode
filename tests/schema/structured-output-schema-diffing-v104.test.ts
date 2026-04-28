import { describe, it, expect } from "vitest";
import { StructuredOutputSchemaDiffer, SchemaDefinition, SchemaDiff } from "../src/schema/structured-output-schema-diffing-v104";

describe("StructuredOutputSchemaDiffer", () => {
  it("should calculate diff when schema B adds a new field", () => {
    const schemaA: SchemaDefinition = {
      name: { type: "string" },
      age: { type: "number" },
    };
    const schemaB: SchemaDefinition = {
      name: { type: "string" },
      age: { type: "number" },
      email: { type: "string" },
    };
    const differ = new StructuredOutputSchemaDiffer();
    const diff = differ.calculateDiff(schemaA, schemaB);

    expect(diff.added).toEqual(["email"]);
    expect(diff.removed).toEqual([]);
    expect(diff.modified).toEqual([]);
  });

  it("should calculate diff when schema B removes a field", () => {
    const schemaA: SchemaDefinition = {
      name: { type: "string" },
      age: { type: "number" },
      optionalField: { type: "boolean" },
    };
    const schemaB: SchemaDefinition = {
      name: { type: "string" },
      age: { type: "number" },
    };
    const differ = new StructuredOutputSchemaDiffer();
    const diff = differ.calculateDiff(schemaA, schemaB);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual(["optionalField"]);
    expect(diff.modified).toEqual([]);
  });

  it("should calculate diff when a field type is modified", () => {
    const schemaA: SchemaDefinition = {
      id: { type: "string" },
      status: { type: "string" },
    };
    const schemaB: SchemaDefinition = {
      id: { type: "string" },
      status: { type: "boolean" },
    };
    const differ = new StructuredOutputSchemaDiffer();
    const diff = differ.calculateDiff(schemaA, schemaB);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.modified).toEqual([
      { field: "status", oldType: "string", newType: "boolean" },
    ]);
  });
});