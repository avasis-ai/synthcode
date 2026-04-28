import { describe, it, expect } from "vitest";
import { SchemaConf } from "../src/validation/structured-tool-output-validation-pipeline-v65";

describe("SchemaConf", () => {
  it("should correctly initialize with a schema definition", async () => {
    const schema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
      required: ["name"],
    };
    const conf = new SchemaConf(schema);
    expect(conf).toBeInstanceOf(SchemaConf);
    // Assuming SchemaConf stores the schema internally or has a way to verify it
    // Since we don't see the constructor implementation, we test basic instantiation.
  });

  it("should pass validation when input matches the schema", async () => {
    const schema: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        isActive: { type: "boolean" },
      },
      required: ["id"],
    };
    const conf = new SchemaConf(schema);
    const validData = { id: "test-123", isActive: true };

    const result = await conf.validate(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation when input is missing required fields", async () => {
    const schema: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        optionalField: { type: "string" },
      },
      required: ["id"],
    };
    const conf = new SchemaConf(schema);
    const invalidData = { optionalField: "some value" }; // Missing 'id'

    const result = await conf.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: id");
  });
});