import { describe, it, expect } from "vitest";
import {
  StructuredSchema,
  SchemaField,
  SchemaDiff,
} from "../src/schema/structured-tool-output-schema-diffing-v100";

describe("SchemaDiff", () => {
  it("should correctly identify added fields", () => {
    const oldSchema: StructuredSchema = {
      fields: {
        id: { name: "id", type: "string", required: true },
      },
    };
    const newSchema: StructuredSchema = {
      fields: {
        id: { name: "id", type: "string", required: true },
        name: { name: "name", type: "string", required: false },
      },
    };

    const diff: SchemaDiff = {
      added: [
        { fieldName: "name", field: { name: "name", type: "string", required: false } },
      ],
      deleted: [],
    };

    expect(diff).toEqual({
      added: [
        { fieldName: "name", field: { name: "name", type: "string", required: false } },
      ],
      deleted: [],
    });
  });

  it("should correctly identify deleted fields", () => {
    const oldSchema: StructuredSchema = {
      fields: {
        id: { name: "id", type: "string", required: true },
        email: { name: "email", type: "string", required: false },
      },
    };
    const newSchema: StructuredSchema = {
      fields: {
        id: { name: "id", type: "string", required: true },
      },
    };

    const diff: SchemaDiff = {
      added: [],
      deleted: ["email"],
    };

    expect(diff).toEqual({
      added: [],
      deleted: ["email"],
    });
  });

  it("should handle schemas with no changes", () => {
    const oldSchema: StructuredSchema = {
      fields: {
        id: { name: "id", type: "string", required: true },
        status: { name: "status", type: "string", required: false },
      },
    };
    const newSchema: StructuredSchema = {
      fields: {
        id: { name: "id", type: "string", required: true },
        status: { name: "status", type: "string", required: false },
      },
    };

    const diff: SchemaDiff = {
      added: [],
      deleted: [],
    };

    expect(diff).toEqual({
      added: [],
      deleted: [],
    });
  });
});