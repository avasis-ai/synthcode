import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v139";
import { SchemaDefinition } from "../src/schema/schema-types";

describe("StructuredToolOutputSchemaDiffer", () => {
  it("should correctly identify added fields when schema B has more fields than schema A", () => {
    const schemaA: SchemaDefinition = {
      properties: {
        fieldA: { type: "string" },
      },
    };
    const schemaB: SchemaDefinition = {
      properties: {
        fieldA: { type: "string" },
        newFieldB: { type: "number" },
      },
    };

    const differ = new StructuredToolOutputSchemaDiffer(schemaA, schemaB);
    const diff = differ.diffSchemas();

    expect(diff.addedFields).toHaveLength(1);
    expect(diff.addedFields[0].fieldName).toBe("newFieldB");
    expect(diff.removedFields).toHaveLength(0);
    expect(diff.modifiedFields).toHaveLength(0);
  });

  it("should correctly identify removed fields when schema B has fewer fields than schema A", () => {
    const schemaA: SchemaDefinition = {
      properties: {
        fieldA: { type: "string" },
        removedFieldA: { type: "boolean" },
      },
    };
    const schemaB: SchemaDefinition = {
      properties: {
        fieldA: { type: "string" },
      },
    };

    const differ = new StructuredToolOutputSchemaDiffer(schemaA, schemaB);
    const diff = differ.diffSchemas();

    expect(diff.addedFields).toHaveLength(0);
    expect(diff.removedFields).toHaveLength(1);
    expect(diff.removedFields[0].fieldName).toBe("removedFieldA");
    expect(diff.modifiedFields).toHaveLength(0);
  });

  it("should correctly identify modified fields when a field's type changes", () => {
    const schemaA: SchemaDefinition = {
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
      },
    };
    const schemaB: SchemaDefinition = {
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "string" }, // Type changed from number to string
      },
    };

    const differ = new StructuredToolOutputSchemaDiffer(schemaA, schemaB);
    const diff = differ.diffSchemas();

    expect(diff.addedFields).toHaveLength(0);
    expect(diff.removedFields).toHaveLength(0);
    expect(diff.modifiedFields).toHaveLength(1);
    expect(diff.modifiedFields[0].fieldName).toBe("fieldB");
    expect(diff.modifiedFields[0].details).toEqual({
      oldType: "number",
      newType: "string",
    });
  });
});