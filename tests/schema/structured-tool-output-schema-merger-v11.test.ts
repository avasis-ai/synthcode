import { describe, it, expect } from "vitest";
import {
  SchemaConflictError,
  SchemaMergeOptions,
  MergeReport,
  FieldMergeReport,
} from "../src/schema/structured-tool-output-schema-merger-v11";
import {z} from "zod";

describe("SchemaMergerV11", () => {
  it("should successfully merge two simple schemas with compatible types", async () => {
    const schema1 = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schema2 = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const merger = new SchemaMergerV11();
    const report: MergeReport = await merger.merge(
      schema1,
      schema2,
      { strategy: "union-if-compatible" }
    );

    expect(report.success).toBe(true);
    expect(report.conflicts).toEqual([]);
    expect(report.fieldReports.length).toBe(2); // id and name
    expect(report.fieldReports.some(r => r.fieldName === "id" && r.decision === "kept from left")).toBe(true);
    expect(report.fieldReports.some(r => r.fieldName === "name" && r.decision === "merged")).toBe(true);
  });

  it("should throw SchemaConflictError when an unresolvable conflict occurs", async () => {
    const schema1 = z.object({
      value: z.number(),
    });
    const schema2 = z.object({
      value: z.string(),
    });

    const merger = new SchemaMergerV11();
    await expect(
      merger.merge(schema1, schema2, { strategy: "prefer-left" })
    ).rejects.toThrow(SchemaConflictError);
  });

  it("should handle missing fields gracefully based on strategy", async () => {
    const schema1 = z.object({
      a: z.string(),
    });
    const schema2 = z.object({
      b: z.boolean(),
    });

    const merger = new SchemaMergerV11();
    const report: MergeReport = await merger.merge(
      schema1,
      schema2,
      { strategy: "prefer-left" }
    );

    expect(report.success).toBe(true);
    expect(report.conflicts).toEqual([]);
    expect(report.fieldReports.length).toBe(2); // a and b
    expect(report.fieldReports.some(r => r.fieldName === "a" && r.decision === "kept from left")).toBe(true);
    expect(report.fieldReports.some(r => r.fieldName === "b" && r.decision === "kept from right")).toBe(true);
  });
});