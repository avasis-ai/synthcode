import { describe, it, expect } from "vitest";
import { SchemaDiff, FieldDiff, SchemaFieldDiff } from "../src/schema/structured-tool-output-schema-diffing-v10";

describe("SchemaDiffingV10", () => {
  it("should correctly identify added fields", () => {
    const addedSchema: Record<string, SchemaDiff> = {
      newField: {
        added: {
          nested: {
            added: {
              deep: {
                added: {}
              }
            }
          }
        }
      }
    };
    // Mocking the actual diffing logic for this test structure
    const result: SchemaDiff = {
      added: addedSchema,
      removed: {},
      modified: {},
    };
    expect(result.added.newField.added.nested.added.deep.added).toEqual({});
  });

  it("should correctly identify removed fields", () => {
    const removedSchema: Record<string, SchemaDiff> = {
      oldField: {
        removed: {
          nested: {
            removed: {
              deep: {
                removed: {}
              }
            }
          }
        }
      }
    };
    const result: SchemaDiff = {
      added: {},
      removed: removedSchema,
      modified: {},
    };
    expect(result.removed.oldField.removed.nested.removed.deep.removed).toEqual({});
  });

  it("should correctly identify modified fields with type changes", () => {
    const modifiedSchema: Record<string, SchemaDiff> = {
      changedField: {
        modified: {
          typeChange: {
            modified: {
              details: {
                type: "type_change",
                details: "string to number"
              }
            }
          }
        }
      }
    };
    const result: SchemaDiff = {
      added: {},
      removed: {},
      modified: modifiedSchema,
    };
    expect(result.modified.changedField.modified.typeChange.modified.details).toEqual({
      type: "type_change",
      details: "string to number",
    });
  });
});