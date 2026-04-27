import { describe, it, expect } from "vitest";
import { resolveToolInputSchema } from "../src/validation/tool-input-schema-resolver";

describe("resolveToolInputSchema", () => {
  it("should resolve a simple string schema correctly", async () => {
    const schema: any = {
      toolName: { type: "string", required: true, description: "The name of the tool" },
    };
    const result = await resolveToolInputSchema(schema);
    expect(result).toEqual({
      toolName: { type: "string", required: true, description: "The name of the tool" },
    });
  });

  it("should resolve a nested object schema correctly", async () => {
    const schema: any = {
      parameters: {
        type: "object",
        required: true,
        properties: {
          userId: { type: "string", required: true },
          limit: { type: "number", required: false },
        },
      },
    };
    const result = await resolveToolInputSchema(schema);
    expect(result).toEqual({
      parameters: {
        type: "object",
        required: true,
        properties: {
          userId: { type: "string", required: true },
          limit: { type: "number", required: false },
        },
      },
    });
  });

  it("should handle optional properties in the schema", async () => {
    const schema: any = {
      optionalField: { type: "string", required: false },
      requiredField: { type: "string", required: true },
    };
    const result = await resolveToolInputSchema(schema);
    expect(result).toEqual({
      optionalField: { type: "string", required: false },
      requiredField: { type: "string", required: true },
    });
  });
});