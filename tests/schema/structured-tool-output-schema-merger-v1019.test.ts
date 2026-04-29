import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v1019";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge schemas using union strategy correctly", () => {
    const mergeConfig: { field: string; strategy: "union" | "intersection" | "precedence"; }[] = [
      { field: "name", strategy: "union" },
    ];
    const merger = new StructuredToolOutputSchemaMerger(mergeConfig);

    const schema1: any = { name: { type: "string", description: "Name from source 1" } };
    const schema2: any = { name: { type: "string", description: "Name from source 2" } };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.name.description).toContain("Name from source 1");
    expect(mergedSchema.name.description).toContain("Name from source 2");
  });

  it("should merge schemas using intersection strategy correctly", () => {
    const mergeConfig: { field: string; strategy: "union" | "intersection" | "precedence"; }[] = [
      { field: "age", strategy: "intersection" },
    ];
    const merger = new StructuredToolOutputSchemaMerger(mergeConfig);

    const schema1: any = { age: { type: "integer", description: "Age from source 1" } };
    const schema2: any = { age: { type: "integer", description: "Age from source 2" } };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.age.description).toContain("Age from source 1");
    expect(mergedSchema.age.description).toContain("Age from source 2");
  });

  it("should merge schemas using precedence strategy correctly", () => {
    const mergeConfig: { field: string; strategy: "union" | "intersection" | "precedence"; }[] = [
      { field: "optionalField", strategy: "precedence" },
    ];
    const merger = new StructuredToolOutputSchemaMerger(mergeConfig);

    const schema1: any = { optionalField: { type: "boolean", description: "Default value" } };
    const schema2: any = { optionalField: { type: "boolean", description: "Overridden value" } };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.optionalField.description).toBe("Overridden value");
  });
});