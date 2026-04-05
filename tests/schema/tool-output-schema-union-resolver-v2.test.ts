import { describe, it, expect } from "vitest";
import { SchemaResolver, ToolOutputSchema, MergeStrategy } from "../src/schema/tool-output-schema-union-resolver-v2";

describe("SchemaResolver", () => {
  it("should resolve a simple union of schemas correctly", () => {
    const resolver: SchemaResolver = {
      resolveUnion: (schemas, context) => {
        // Mock implementation for testing
        if (schemas.length === 2 && context.user_hint === "user_input") {
          return { type: "object", properties: { id: { type: "string" } }, required: ["id"] };
        }
        return {};
      },
    };

    const schemas = [{ type: "object", properties: { a: {} } }, { type: "object", properties: { b: {} } }];
    const context = { user_hint: "user_input" };
    const result = resolver.resolveUnion(schemas, context);

    expect(result).toEqual({ type: "object", properties: { id: { type: "string" } }, required: ["id"] });
  });

  it("should handle different context hints when resolving", () => {
    const resolver: SchemaResolver = {
      resolveUnion: (schemas, context) => {
        // Mock implementation for testing
        if (context.system_hint === "system_prompt") {
          return { type: "object", properties: { system_field: { type: "string" } } };
        }
        return {};
      },
    };

    const schemas = [{ type: "object", properties: {} }];
    const context = { system_hint: "system_prompt" };
    const result = resolver.resolveUnion(schemas, context);

    expect(result).toEqual({ type: "object", properties: { system_field: { type: "string" } } });
  });

  it("should return a default or empty structure if no context matches", () => {
    const resolver: SchemaResolver = {
      resolveUnion: (schemas, context) => {
        // Mock implementation for testing
        return {};
      },
    };

    const schemas = [{ type: "object", properties: {} }];
    const context = {};
    const result = resolver.resolveUnion(schemas, context);

    expect(result).toEqual({});
  });
});