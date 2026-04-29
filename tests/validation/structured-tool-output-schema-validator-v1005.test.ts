import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1005 } from "../src/validation/structured-tool-output-schema-validator-v1005";

describe("StructuredToolOutputSchemaValidatorV1005", () => {
  it("should validate a correctly structured tool output", () => {
    const schema = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        toolOutput: { type: "string" },
      },
      required: ["toolName", "toolOutput"],
    };
    const validator = new StructuredToolOutputSchemaValidatorV1005<Record<string, any>>();
    const result = validator.validate({
      toolName: "search",
      toolOutput: "Search results for query.",
    }, schema);
    expect(result).toEqual([]);
  });

  it("should return errors for missing required fields", () => {
    const schema = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        toolOutput: { type: "string" },
      },
      required: ["toolName", "toolOutput"],
    };
    const validator = new StructuredToolOutputSchemaValidatorV1005<Record<string, any>>();
    const result = validator.validate({
      toolName: "search",
      // toolOutput is missing
    }, schema);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(error => error.field === "toolOutput")).toBe(true);
  });

  it("should return errors for incorrect data types", () => {
    const schema = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        toolOutput: { type: "string" },
      },
      required: ["toolName", "toolOutput"],
    };
    const validator = new StructuredToolOutputSchemaValidatorV1005<Record<string, any>>();
    const result = validator.validate({
      toolName: 123, // Incorrect type
      toolOutput: "some output",
    }, schema);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(error => error.field === "toolName" && error.rule === "type")).toBe(true);
  });
});