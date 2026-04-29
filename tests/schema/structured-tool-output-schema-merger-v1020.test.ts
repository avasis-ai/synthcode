import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV1020 } from "../src/schema/structured-tool-output-schema-merger-v1020.js";

describe("StructuredToolOutputSchemaMergerV1020", () => {
  it("should merge schemas using 'prefer-latest' strategy correctly", () => {
    const options = { mergeStrategy: "prefer-latest" };
    const merger = new StructuredToolOutputSchemaMergerV1020(options);

    const schemaA = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const schemaB = {
      type: "object",
      properties: {
        age: { type: "boolean" },
        email: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "boolean" },
        email: { type: "string" },
      },
    });
  });

  it("should merge schemas using 'prefer-union' strategy correctly", () => {
    const options = { mergeStrategy: "prefer-union" };
    const merger = new StructuredToolOutputSchemaMergerV1020(options);

    const schemaA = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const schemaB = {
      type: "object",
      properties: {
        age: { type: "boolean" },
        email: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
    });
  });

  it("should merge schemas using 'prefer-intersection' strategy correctly", () => {
    const options = { mergeStrategy: "prefer-intersection" };
    const merger = new StructuredToolOutputSchemaMergerV1020(options);

    const schemaA = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const schemaB = {
      type: "object",
      properties: {
        age: { type: "boolean" },
        email: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schemaA, schemaB);

    expect(mergedSchema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
    });
  });
});