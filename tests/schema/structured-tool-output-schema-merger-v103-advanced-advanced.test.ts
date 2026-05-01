import { describe, it, expect } from "vitest";
import { mergeSchemas } from "../src/schema/structured-tool-output-schema-merger-v103-advanced-advanced";

describe("mergeSchemas", () => {
  it("should prefer the left schema when conflictStrategy is 'prefer_left'", async () => {
    const leftSchema = {
      id: "string",
      name: { type: "string", description: "Name from left" },
      optionalField: "boolean",
    };
    const rightSchema = {
      id: "number",
      name: { type: "string", description: "Name from right" },
      newField: "string",
    };

    const merged = await mergeSchemas(leftSchema, rightSchema, { conflictStrategy: "prefer_left" });

    expect(merged.id).toBe("string");
    expect(merged.name.description).toBe("Name from left");
    expect(merged.optionalField).toBe("boolean");
    expect(merged.newField).toBe("string");
  });

  it("should prefer the right schema when conflictStrategy is 'prefer_right'", async () => {
    const leftSchema = {
      id: "string",
      name: { type: "string", description: "Name from left" },
      optionalField: "boolean",
    };
    const rightSchema = {
      id: "number",
      name: { type: "string", description: "Name from right" },
      newField: "string",
    };

    const merged = await mergeSchemas(leftSchema, rightSchema, { conflictStrategy: "prefer_right" });

    expect(merged.id).toBe("number");
    expect(merged.name.description).toBe("Name from right");
    expect(merged.optionalField).toBe("boolean"); // Should keep left if not conflicting, but here we test right preference on conflict
    expect(merged.newField).toBe("string");
  });

  it("should deeply merge schemas when conflictStrategy is 'merge_deep'", async () => {
    const leftSchema = {
      user: {
        type: "object",
        properties: {
          firstName: "string",
          lastName: { type: "string", description: "Left last name" },
        },
      },
    };
    const rightSchema = {
      user: {
        type: "object",
        properties: {
          lastName: { type: "string", description: "Right last name" },
          email: "string",
        },
      },
    };

    const merged = await mergeSchemas(leftSchema, rightSchema, { conflictStrategy: "merge_deep" });

    expect(merged.user.properties.firstName).toBe("string");
    expect(merged.user.properties.lastName).toEqual({ type: "string", description: "Right last name" }); // Deep merge should update description
    expect(merged.user.properties.email).toBe("string");
  });
});