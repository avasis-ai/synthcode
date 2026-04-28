import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v13";
import { z } from "zod";

describe("StructuredToolOutputSchemaDiffer", () => {
  it("should correctly identify added fields", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
    });

    const differ = new StructuredToolOutputSchemaDiffer(schema1, schema2);
    const diffs = differ.diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe("description");
    expect(diffs[0].diff.added).toEqual({
      description: {},
    });
    expect(diffs[0].diff.removed).toEqual({});
    expect(diffs[0].diff.modified).toBeNull();
  });

  it("should correctly identify removed fields", () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
      optionalField: z.boolean().optional(),
    });
    const schema2 = z.object({
      id: z.string(),
      name: z.string(),
    });

    const differ = new StructuredToolOutputSchemaDiffer(schema1, schema2);
    const diffs = differ.diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe("optionalField");
    expect(diffs[0].diff.added).toEqual({});
    expect(diffs[0].diff.removed).toEqual({
      optionalField: {},
    });
    expect(diffs[0].diff.modified).toBeNull();
  });

  it("should correctly identify modified field types", () => {
    const schema1 = z.object({
      userId: z.string(),
      isActive: z.boolean(),
    });
    const schema2 = z.object({
      userId: z.string(),
      isActive: z.string(),
    });

    const differ = new StructuredToolOutputSchemaDiffer(schema1, schema2);
    const diffs = differ.diff();

    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe("isActive");
    expect(diffs[0].diff.added).toEqual({});
    expect(diffs[0].diff.removed).toEqual({});
    expect(diffs[0].diff.modified).toEqual({
      field: "isActive",
      oldType: Boolean,
      newType: String,
      details: undefined,
    });
  });
});