import { describe, it, expect } from "vitest";
import { z } from "zod";
import { StructuredToolOutputSchemaDiffingV107 } from "../src/schema/structured-tool-output-schema-diffing-v107";

describe("StructuredToolOutputSchemaDiffingV107", () => {
  const diffService = new StructuredToolOutputSchemaDiffingV107();

  it("should detect a simple field addition", () => {
    const schemaV1 = z.object({
      id: z.string(),
    });
    const schemaV2 = z.object({
      id: z.string(),
      name: z.string(),
    });

    const diff = diffService.diffSchemas(schemaV1, schemaV2);
    expect(diff.changes).toHaveLength(1);
    expect(diff.changes[0].type).toBe("fieldAdded");
    expect(diff.changes[0].path).toContain("name");
  });

  it("should detect a field type change", () => {
    const schemaV1 = z.object({
      count: z.number(),
    });
    const schemaV2 = z.object({
      count: z.string(),
    });

    const diff = diffService.diffSchemas(schemaV1, schemaV2);
    expect(diff.changes).toHaveLength(1);
    expect(diff.changes[0].type).toBe("typeChanged");
    expect(diff.changes[0].path).toContain("count");
  });

  it("should detect a field removal", () => {
    const schemaV1 = z.object({
      a: z.string(),
      b: z.number(),
    });
    const schemaV2 = z.object({
      a: z.string(),
    });

    const diff = diffService.diffSchemas(schemaV1, schemaV2);
    expect(diff.changes).toHaveLength(1);
    expect(diff.changes[0].type).toBe("fieldRemoved");
    expect(diff.changes[0].path).toContain("b");
  });
});