import { describe, it, expect } from "vitest";
import { z } from "zod";
import { SchemaDiff, DiffReport, SchemaDiffingAdvanced } from "../src/schema/structured-tool-output-schema-diffing-v139-advanced";

describe("SchemaDiffingAdvanced", () => {
  it("should detect a missing field", () => {
    const schemaA = z.object({
      id: z.string(),
      name: z.string(),
    });
    const schemaB = z.object({
      id: z.string(),
      age: z.number(),
    });

    const diffReport = SchemaDiffingAdvanced.diff(schemaA, schemaB);

    expect(diffReport.differences).toHaveLength(1);
    expect(diffReport.differences[0].diffType).toBe("MISSING");
    expect(diffReport.differences[0].path).toBe("name");
  });

  it("should detect an added field", () => {
    const schemaA = z.object({
      id: z.string(),
    });
    const schemaB = z.object({
      id: z.string(),
      email: z.string().email(),
    });

    const diffReport = SchemaDiffingAdvanced.diff(schemaA, schemaB);

    expect(diffReport.differences).toHaveLength(1);
    expect(diffReport.differences[0].diffType).toBe("ADDED");
    expect(diffReport.differences[0].path).toBe("email");
  });

  it("should detect a type change", () => {
    const schemaA = z.object({
      count: z.number(),
    });
    const schemaB = z.object({
      count: z.string(),
    });

    const diffReport = SchemaDiffingAdvanced.diff(schemaA, schemaB);

    expect(diffReport.differences).toHaveLength(1);
    expect(diffReport.differences[0].diffType).toBe("TYPE_CHANGE");
    expect(diffReport.differences[0].path).toBe("count");
  });
});