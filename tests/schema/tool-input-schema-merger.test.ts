import { describe, it, expect } from "vitest";
import { ToolInputSchemaMerger } from "../src/schema/tool-input-schema-merger";

describe("ToolInputSchemaMerger", () => {
  it("should merge two simple schemas correctly", () => {
    const schema1 = { type: "object", properties: { a: { type: "string" } } };
    const schema2 = { type: "object", properties: { b: { type: "number" } } };
    const options = { overwrite: true };
    const merger = new ToolInputSchemaMerger([schema1, schema2], options);

    const { mergedSchema, report } = merger.mergeSchemas();

    expect(mergedSchema).toEqual({
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "number" },
      },
    });
    expect(report.warnings).toHaveLength(0);
  });

  it("should handle overlapping properties based on options", () => {
    const schema1 = { type: "object", properties: { common: { type: "string", description: "desc1" } } };
    const schema2 = { type: "object", properties: { common: { type: "boolean", description: "desc2" } } };
    const optionsOverwrite = { overwrite: true };
    const optionsKeepFirst = { overwrite: false };

    // Test overwrite = true
    const mergerOverwrite = new ToolInputSchemaMerger([schema1, schema2], optionsOverwrite);
    const { mergedSchema: mergedSchemaOverwrite } = mergerOverwrite.mergeSchemas();
    expect(mergedSchemaOverwrite.properties.common.type).toBe("boolean");
    expect(mergedSchemaOverwrite.properties.common.description).toBe("desc2");

    // Test overwrite = false
    const mergerKeepFirst = new ToolInputSchemaMerger([schema1, schema2], optionsKeepFirst);
    const { mergedSchema: mergedSchemaKeepFirst } = mergerKeepFirst.mergeSchemas();
    expect(mergedSchemaKeepFirst.properties.common.type).toBe("string");
    expect(mergedSchemaKeepFirst.properties.common.description).toBe("desc1");
  });

  it("should report warnings for potential data loss when overwriting", () => {
    const schema1 = { type: "object", properties: { common: { type: "string", description: "original" } } };
    const schema2 = { type: "object", properties: { common: { type: "boolean", description: "new" } } };
    const options = { overwrite: true };
    const merger = new ToolInputSchemaMerger([schema1, schema2], options);

    const { report } = merger.mergeSchemas();

    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]).toContain("Overwriting property 'common'");
  });
});