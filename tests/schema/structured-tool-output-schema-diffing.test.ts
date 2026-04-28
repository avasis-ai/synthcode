import { describe, it, expect } from "vitest";
import { diffSchemas } from "../src/schema/structured-tool-output-schema-diffing";
import { z } from "zod";

describe("diffSchemas", () => {
  it("should return empty diff when schemas are identical", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: z.string(),
        name: z.string(),
      },
      required: ["id", "name"],
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: z.string(),
        name: z.string(),
      },
      required: ["id", "name"],
    };

    const diff = diffSchemas(schemaA, schemaB);
    expect(diff.added).toEqual({});
    expect(diff.removed).toEqual({});
    expect(diff.modified).toEqual({});
  });

  it("should detect added properties", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: z.string(),
      },
      required: ["id"],
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: z.string(),
        email: z.string().email(),
      },
      required: ["id", "email"],
    };

    const diff = diffSchemas(schemaA, schemaB);
    expect(diff.added).toEqual({
      email: { type: "string", zodType: z.string().email() },
    });
    expect(diff.removed).toEqual({});
    expect(diff.modified).toEqual({});
  });

  it("should detect removed properties", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: z.string(),
        optionalField: z.number().optional(),
      },
      required: ["id"],
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: z.string(),
      },
      required: ["id"],
    };

    const diff = diffSchemas(schemaA, schemaB);
    expect(diff.added).toEqual({});
    expect(diff.removed).toEqual({
      optionalField: { type: "number", zodType: z.number().optional() },
    });
    expect(diff.modified).toEqual({});
  });
});