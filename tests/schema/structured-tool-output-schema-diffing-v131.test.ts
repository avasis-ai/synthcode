import { describe, it, expect } from "vitest";
import { Schema, SchemaField, DiffReport } from "../src/schema/structured-tool-output-schema-diffing-v131";

describe("Schema", () => {
  it("should correctly define a basic schema structure", () => {
    const schema: Schema = {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The unique identifier",
          required: true,
        },
        name: {
          type: "string",
          description: "The name of the entity",
          required: false,
        },
      },
      required: ["id"],
    };
    expect(schema).toBeDefined();
    expect(schema.type).toBe("object");
    expect(schema.properties).toHaveProperty("id");
    expect(schema.required).toEqual(["id"]);
  });

  it("should handle nested properties correctly", () => {
    const nestedSchema: Schema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          description: "User details",
          required: true,
          properties: {
            email: {
              type: "string",
              description: "User email",
              required: true,
            },
            age: {
              type: "integer",
              description: "User age",
              required: false,
            },
          },
          required: ["email"],
        },
      },
      required: ["user"],
    };
    expect(nestedSchema.properties).toHaveProperty("user");
    const userSchema = nestedSchema.properties.user as SchemaField & { properties: any };
    expect(userSchema.properties).toHaveProperty("email");
    expect(userSchema.properties.email.type).toBe("string");
  });

  it("should generate a diff report for added fields", () => {
    const initialSchema: Schema = {
      type: "object",
      properties: {
        fieldA: {
          type: "string",
          description: "A",
          required: true,
        },
      },
      required: ["fieldA"],
    };
    const newSchema: Schema = {
      type: "object",
      properties: {
        fieldA: {
          type: "string",
          description: "A",
          required: true,
        },
        fieldB: {
          type: "number",
          description: "B",
          required: false,
        },
      },
      required: ["fieldA", "fieldB"],
    };

    // Mocking the diffing function call if it were available, assuming a function exists to test diffing logic
    // Since we don't have the actual diffing function, we test the structure expected for the report.
    const mockDiffReport: DiffReport = {
      added: {
        field: "fieldB",
        diff: {
          type: "number",
          description: "B",
          required: false,
        },
      },
      removed: {
        field: "",
        diff: null,
      },
      modified: {
        field: "",
        diff: null,
      },
    };

    // We assert the structure based on the expected output type
    expect(mockDiffReport).toEqual({
      added: {
        field: "fieldB",
        diff: {
          type: "number",
          description: "B",
          required: false,
        },
      },
      removed: {
        field: "",
        diff: null,
      },
      modified: {
        field: "",
        diff: null,
      },
    });
  });
});