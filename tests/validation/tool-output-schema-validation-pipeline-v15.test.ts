import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidationPipeline } from "../src/validation/tool-output-schema-validation-pipeline-v15";

describe("ToolOutputSchemaValidationPipeline", () => {
  it("should return no errors for valid data", () => {
    const schema = {
      name: { type: "string", required: true },
      age: { type: "number", required: false },
    };
    const pipeline = new ToolOutputSchemaValidationPipeline(schema);
    const data = { name: "TestUser", age: 30 };
    const errors = pipeline.validate(data);
    expect(errors).toBeNull();
  });

  it("should return errors for missing required fields", () => {
    const schema = {
      name: { type: "string", required: true },
      email: { type: "string", required: true },
    };
    const pipeline = new ToolOutputSchemaValidationPipeline(schema);
    const data = { name: "TestUser" };
    const errors = pipeline.validate(data);
    expect(errors).not.toBeNull();
    expect(errors!.length).toBeGreaterThan(0);
    expect(errors!.some(err => err.field === "email" && err.message.includes("is required"))).toBe(true);
  });

  it("should return errors for incorrect data types", () => {
    const schema = {
      id: { type: "number", required: true },
      isActive: { type: "boolean", required: true },
    };
    const pipeline = new ToolOutputSchemaValidationPipeline(schema);
    const data = { id: "not-a-number", isActive: "true" };
    const errors = pipeline.validate(data);
    expect(errors).not.toBeNull();
    expect(errors!.length).toBeGreaterThan(0);
    expect(errors!.some(err => err.field === "id" && err.message.includes("must be a number"))).toBe(true);
  });
});