import { describe, it, expect } from "vitest";
import { calculateSchemaDiff } from "../src/schema/structured-tool-output-schema-diffing-v122";
import { SchemaNode } from "../src/schema/schema-diffing-types";

describe("calculateSchemaDiff", () => {
  it("should return an empty diff when schemas are identical", () => {
    const schemaV1: SchemaNode = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const schemaV2: SchemaNode = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };

    const diff = calculateSchemaDiff(schemaV1, schemaV2);
    expect(diff).toEqual({
      properties: {},
      required: [],
      type: null,
      description: null,
    });
  });

  it("should detect added properties between schemas", () => {
    const schemaV1: SchemaNode = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    };
    const schemaV2: SchemaNode = {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        isActive: { type: "boolean" },
      },
      required: ["id", "email"],
    };

    const diff = calculateSchemaDiff(schemaV1, schemaV2);
    expect(diff.properties).toEqual({
      email: { added: true },
      isActive: { added: true },
    });
    expect(diff.required).toEqual(["email"]);
  });

  it("should detect removed and modified properties between schemas", () => {
    const schemaV1: SchemaNode = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        oldField: { type: "string" },
      },
      required: ["id", "name", "oldField"],
    };
    const schemaV2: SchemaNode = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string", description: "The user's full name" },
        newField: { type: "number" },
      },
      required: ["id", "name", "newField"],
    };

    const diff = calculateSchemaDiff(schemaV1, schemaV2);
    expect(diff.properties).toEqual({
      name: { changed: true },
      oldField: { removed: true },
      newField: { added: true },
    });
    expect(diff.required).toEqual(["name", "newField"]);
  });
});