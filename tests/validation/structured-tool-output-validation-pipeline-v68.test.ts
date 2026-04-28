import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v68";

describe("StructuredToolOutputValidator", () => {
  it("should return valid report for a correctly structured payload", () => {
    const validator = new StructuredToolOutputValidator();
    const schema: any = {
      tool_name: { type: "string" },
      arguments: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "integer" },
        },
        required: ["query"],
      },
    };
    const payload: Record<string, unknown> = {
      tool_name: "search_tool",
      arguments: {
        query: "test query",
        limit: 10,
      },
    };
    const context: any = { schema, payload };
    const report = validator.validate(context, payload);

    expect(report.isValid).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it("should report errors for missing required fields", () => {
    const validator = new StructuredToolOutputValidator();
    const schema: any = {
      tool_name: { type: "string" },
      arguments: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "integer" },
        },
        required: ["query"],
      },
    };
    const payload: Record<string, unknown> = {
      tool_name: "search_tool",
      arguments: {
        limit: 5,
      },
    };
    const context: any = { schema, payload };
    const report = validator.validate(context, payload);

    expect(report.isValid).toBe(false);
    expect(report.errors.length).toBeGreaterThanOrEqual(1);
    const hasMissingQueryError = report.errors.some(
      (err: any) => err.field === "arguments.query" && err.message.includes("is required")
    );
    expect(hasMissingQueryError).toBe(true);
  });

  it("should report errors for incorrect data types", () => {
    const validator = new StructuredToolOutputValidator();
    const schema: any = {
      tool_name: { type: "string" },
      arguments: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "integer" },
        },
        required: ["query"],
      },
    };
    const payload: Record<string, unknown> = {
      tool_name: 123,
      arguments: {
        query: "test query",
        limit: "not an integer",
      },
    };
    const context: any = { schema, payload };
    const report = validator.validate(context, payload);

    expect(report.isValid).toBe(false);
    expect(report.errors.length).toBeGreaterThanOrEqual(1);
    const hasTypeError = report.errors.some(
      (err: any) => err.field === "arguments.limit" && err.message.includes("must be an integer")
    );
    expect(hasTypeError).toBe(true);
  });
});