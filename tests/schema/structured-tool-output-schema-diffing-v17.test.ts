import { describe, it, expect } from "vitest";
import { SchemaDiff } from "../src/schema/structured-tool-output-schema-diffing-v17";

describe("SchemaDiff", () => {
  it("should correctly identify an added field", () => {
    const diff: SchemaDiff = {
      path: "$.properties.newField",
      diff: {
        added: {
          name: "newField",
          type: "string",
          description: "A newly added field.",
          required: false,
        },
      },
    };
    expect(diff.path).toBe("$.properties.newField");
    expect(diff.diff.added?.name).toBe("newField");
    expect(diff.diff.added?.type).toBe("string");
  });

  it("should correctly identify a removed field", () => {
    const diff: SchemaDiff = {
      path: "$.properties.oldField",
      diff: {
        removed: {
          name: "oldField",
          type: "integer",
          description: "This field is deprecated.",
          required: true,
        },
      },
    };
    expect(diff.path).toBe("$.properties.oldField");
    expect(diff.diff.removed?.name).toBe("oldField");
    expect(diff.diff.removed?.type).toBe("integer");
  });

  it("should correctly identify a modified field type", () => {
    const diff: SchemaDiff = {
      path: "$.properties.mixedField",
      diff: {
        modified: {
          field: "mixedField",
          oldType: "string",
          newType: "boolean",
        },
      },
    };
    expect(diff.path).toBe("$.properties.mixedField");
    expect(diff.diff.modified?.field).toBe("mixedField");
    expect(diff.diff.modified?.oldType).toBe("string");
    expect(diff.diff.modified?.newType).toBe("boolean");
  });
});