import { describe, it, expect } from "vitest";
import { diffSchema } from "../src/schema/structured-tool-output-schema-diffing-v16";

describe("diffSchema", () => {
  it("should correctly diff two simple object schemas", () => {
    const schema1: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const schema2: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["id", "name", "email"],
    };
    const diff = diffSchema(schema1, schema2);
    expect(diff).toEqual({
      added: ["email"],
      removed: [],
      modified: [],
    });
  });

  it("should detect changes in nested properties", () => {
    const schema1: any = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            age: { type: "integer" },
            city: { type: "string" },
          },
          required: ["age"],
        },
      },
      required: ["user"],
    };
    const schema2: any = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            age: { type: "integer" },
            city: { type: "string", description: "User's location" },
            zipcode: { type: "string" },
          },
          required: ["age", "city"],
        },
      },
      required: ["user"],
    };
    const diff = diffSchema(schema1, schema2);
    expect(diff).toEqual({
      added: [],
      removed: [],
      modified: [
        {
          path: "user.properties.city",
          diff: {
            added: [],
            removed: [],
            modified: [
              {
                path: "description",
                oldValue: undefined,
                newValue: "User's location",
              },
            ],
          },
        },
        {
          path: "user.properties.zipcode",
          diff: {
            added: [],
            removed: [],
            modified: [],
          },
        },
      ],
    });
  });

  it("should handle removal of required fields", () => {
    const schema1: any = {
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "string" },
      },
      required: ["a", "b"],
    };
    const schema2: any = {
      type: "object",
      properties: {
        a: { type: "string" },
        c: { type: "string" },
      },
      required: ["a"],
    };
    const diff = diffSchema(schema1, schema2);
    expect(diff).toEqual({
      added: ["c"],
      removed: ["b"],
      modified: [],
    });
  });
});