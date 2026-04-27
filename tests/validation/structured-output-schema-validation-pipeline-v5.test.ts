import { describe, it, expect } from "vitest";
import { runSchemaValidationPipelineV5 } from "../src/validation/structured-output-schema-validation-pipeline-v5";

describe("runSchemaValidationPipelineV5", () => {
  it("should return valid when input matches the schema", async () => {
    const schema = {
      type: "object",
      properties: {
        title: { type: "string", required: true },
        author: { type: "string", required: true },
        content: { type: "array", items: { type: "object", properties: { type: "string" } } },
      },
      required: ["title", "author"],
    };
    const input = {
      title: "Test Title",
      author: "Test Author",
      content: [{ type: "string", text: "Some content" }],
    };
    const result = await runSchemaValidationPipelineV5(input, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with errors when required fields are missing", async () => {
    const schema = {
      type: "object",
      properties: {
        title: { type: "string", required: true },
        author: { type: "string", required: true },
      },
      required: ["title", "author"],
    };
    const input = {
      title: "Test Title",
    };
    const result = await runSchemaValidationPipelineV5(input, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: author");
  });

  it("should return invalid with type errors when data types mismatch", async () => {
    const schema = {
      type: "object",
      properties: {
        age: { type: "integer", required: true },
        isActive: { type: "boolean", required: true },
      },
      required: ["age", "isActive"],
    };
    const input = {
      age: "twenty",
      isActive: "yes",
    };
    const result = await runSchemaValidationPipelineV5(input, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Type mismatch for field 'age': Expected integer, got string");
    expect(result.errors).toContain("Type mismatch for field 'isActive': Expected boolean, got string");
  });
});