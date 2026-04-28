import { describe, it, expect } from "vitest";
import { SchemaDiffingService } from "../src/schema/structured-tool-output-schema-diffing-v18";

describe("SchemaDiffingService", () => {
  it("should correctly report added fields when comparing schemas", async () => {
    const service = new SchemaDiffingService();
    const schemaV1 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
      },
      required: ["fieldA", "fieldB"],
    };
    const schemaV2 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number"},
        newFieldC: { type: "boolean" },
      },
      required: ["fieldA", "fieldB", "newFieldC"],
    };

    const report = await service.compareSchemas(schemaV1, schemaV2);

    expect(report.length).toBeGreaterThanOrEqual(1);
    const addedField = report.find(r => r.diffType === "added" && r.path.includes("newFieldC"));
    expect(addedField).toBeDefined();
    expect(addedField?.newValue).toEqual({ type: "boolean" });
  });

  it("should correctly report removed fields when comparing schemas", async () => {
    const service = new SchemaDiffingService();
    const schemaV1 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
        removedFieldX: { type: "string" },
      },
      required: ["fieldA", "fieldB", "removedFieldX"],
    };
    const schemaV2 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
      },
      required: ["fieldA", "fieldB"],
    };

    const report = await service.compareSchemas(schemaV1, schemaV2);

    expect(report.length).toBeGreaterThanOrEqual(1);
    const removedField = report.find(r => r.diffType === "removed" && r.path.includes("removedFieldX"));
    expect(removedField).toBeDefined();
    expect(removedField?.oldValue).toEqual({ type: "string" });
  });

  it("should report type mismatches when comparing schemas", async () => {
    const service = new SchemaDiffingService();
    const schemaV1 = {
      type: "object",
      properties: {
        fieldA: { type: "string" },
        fieldB: { type: "number" },
      },
      required: ["fieldA", "fieldB"],
    };
    const schemaV2 = {
      type: "object",
      properties: {
        fieldA: { type: "boolean" }, // Changed from string to boolean
        fieldB: { type: "number" },
      },
      required: ["fieldA", "fieldB"],
    };

    const report = await service.compareSchemas(schemaV1, schemaV2);

    const typeMismatch = report.find(r => r.diffType === "type_mismatch" && r.path.includes("fieldA"));
    expect(typeMismatch).toBeDefined();
    expect(typeMismatch?.oldValue).toEqual({ type: "string" });
    expect(typeMismatch?.newValue).toEqual({ type: "boolean" });
  });
});